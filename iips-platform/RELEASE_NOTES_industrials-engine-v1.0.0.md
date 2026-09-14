# Release Notes — Industrials Engine v1.0.0 (Platform/Implementation Repository)

**Tag:** `industrials-engine-v1.0.0`
**Release date:** 2026-08-09
**Status:** Production release (promoted from `industrials-engine-rc-1.0.0` after independent verification)

---

## Major capabilities

- **Industrials Engine** (`sector.industrials`): visible-demand metric library (backlog, book-to-bill, aftermarket/services %, revenue growth, EBITDA/op margin, FCF yield, order growth, leverage, ROCE, project risk), **D15 v1.2 normative contract** (band→score→pillar→composite→override→verdict; lower-inclusive/upper-exclusive boundaries; round-half-to-even at composite; derived-component missing rule; calibration staging; min-rank overrides), subsegment + business-model-archetype calibration (6 subsegments × 5 archetypes), evidence — implements `SectorPlugin`.
- **Ontology registration** — 8-dimension metadata for CSIP with **zero CSIP change**.
- **Reuses the platform unchanged** — 0 platform/framework/engine modifications.
- **Ten-plugin coexistence:** 8 sector engines + CSIP + Industrials.

## Frozen specification version

- IES-014 v1.0 (frozen) + IES-005 / IES-005.1 contracts
- Consumes frozen Industrials reference assets read-only

## Compatibility

- Sector-neutral platform reused — no platform change
- Coexists with the eight released engines + CSIP
- CSIP ontology compatible (zero change)

## Known limitations

- Qualitative backlog/aftermarket dimensions are calibration-dependent.
- Subsegment cyclicality (capital goods/transport high, defense moderate) handled via calibration.

## Verification

- `tsc --noEmit --strict` clean
- **236/236 tests pass**
- All 10 frozen Industrials outputs reproduced exactly from a clean git clone (D15 v1.2 contract)
- 10 validation fixtures accepted (incl. order cancellation, defense program, EPC overrun, margin compression + leverage → Watch)
- Contract boundary matrix passed
- Independent clean-clone verification passed

## Roadmap

- Industrials v1.1/v2.0 via versioned methodology changes
- Program v1.1: Technology (IES-015), then further sectors
