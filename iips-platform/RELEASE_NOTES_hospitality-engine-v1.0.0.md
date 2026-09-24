# Release Notes — Hospitality Engine v1.0.0 (Platform/Implementation Repository)

**Tag:** `hospitality-engine-v1.0.0`
**Release date:** 2026-08-08
**Status:** Production release (promoted from `hospitality-engine-rc-1.0.0` after independent verification)

---

## Major capabilities

- **Hospitality Engine** (`sector.hospitality`): RevPAR-centric metric library (Occupancy, ADR, RevPAR, GOP margin, RevPAR growth, fee mix, demand quality, ROIC), D15 band→score→pillar→composite scoring (round-half-to-even), business-model calibration (owned/leased/managed/franchised/asset-light), decision engine + overrides (demand shock, occupancy collapse, leverage breach, brand deterioration, governance) + precedence, evidence — implements `SectorPlugin`.
- **Ontology registration** — 8-dimension metadata for CSIP with **zero CSIP change**.
- **Reuses the platform unchanged** — 0 platform/framework/engine modifications.
- **Six-plugin coexistence:** Banking + Insurance + Capital Markets + Healthcare + CSIP + Hospitality.

## Frozen specification version

- IES-010 v1.0 (frozen) + IES-005 / IES-005.1 contracts
- Consumes frozen Hospitality reference assets read-only

## Compatibility

- Sector-neutral platform reused — no platform change
- Coexists with the four released engines + CSIP
- CSIP ontology compatible (zero change)

## Known limitations

- Absolute RevPAR thresholds are calibration-dependent (business model)
- Owned-property leverage sensitivity is higher (per methodology)

## Verification

- `tsc --noEmit --strict` clean
- **123/123 tests pass**
- All 9 frozen Hospitality outputs reproduced exactly from a clean git clone
- 9 validation fixtures accepted (incl. demand shock → Watch, brand deterioration → Avoid, occupancy collapse → Avoid)
- Independent clean-clone verification passed

## Roadmap

- Hospitality v1.1/v2.0 via versioned methodology changes
- Program v1.1: Energy (IES-011+), then further sectors
