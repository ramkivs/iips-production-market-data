# Release Notes — Consumer Engine v1.0.0 (Platform/Implementation Repository)

**Tag:** `consumer-engine-v1.0.0`
**Release date:** 2026-08-08
**Status:** Production release (promoted from `consumer-engine-rc-1.0.0` after independent verification)

---

## Major capabilities

- **Consumer Engine** (`sector.consumer`): brand-driven metric library (pricing power/volume mix, brand/loyalty, margin resilience, distribution/channel mix, FCF yield, innovation intensity, private-label exposure, EBITDA margin, revenue growth, leverage, ROIC), D15 band→score→pillar→composite scoring (round-half-to-even), segment + business-model calibration (6 profiles + demand-durability risk), decision engine + overrides (brand erosion, category disruption, input-cost squeeze, channel loss, leverage breach, governance) + precedence, evidence — implements `SectorPlugin`.
- **Ontology registration** — 8-dimension metadata for CSIP with **zero CSIP change**.
- **Reuses the platform unchanged** — 0 platform/framework/engine modifications.
- **Nine-plugin coexistence:** 7 sector engines + CSIP + Consumer.
- Grounded in Intangible Competitive Advantage + Brand Economics Common Principles (reusable).

## Frozen specification version

- IES-013 v1.0 (frozen) + IES-005 / IES-005.1 contracts
- Consumes frozen Consumer reference assets read-only

## Compatibility

- Sector-neutral platform reused — no platform change
- Coexists with the seven released engines + CSIP
- CSIP ontology compatible (zero change)

## Known limitations

- Qualitative brand/pricing-power dimensions are calibration-dependent.
- Staples-defensive vs discretionary-cyclical handled via calibration.

## Verification

- `tsc --noEmit --strict` clean
- **208/208 tests pass**
- All 10 frozen Consumer outputs reproduced exactly from a clean git clone
- 10 validation fixtures accepted (incl. brand erosion, category disruption, input-cost squeeze, channel loss → Watch/Avoid)
- Independent clean-clone verification passed

## Roadmap

- Consumer v1.1/v2.0 via versioned methodology changes
- Program v1.1: Industrials (IES-014), then further sectors
