# Release Notes — Technology Engine v1.0.0 (Platform/Implementation Repository)

**Tag:** `technology-engine-v1.0.0`
**Release date:** 2026-08-09
**Status:** Production release (promoted from `technology-engine-rc-1.0.0` after independent verification)

---

## Major capabilities

- **Technology Engine** (`sector.technology`): tech metric library (TM-001..TM-012: EBITDA margin, revenue growth, debt/EBITDA, EV/revenue, FCF yield, recurring revenue %, NRR, gross margin, R&D intensity, customer concentration, capex intensity, usage growth), **D15 v1.3 normative contract** (band→score→pillar→composite→override→verdict; lower-inclusive/upper-exclusive boundaries; **metric-specific immutable band cardinality** — TM-009 is 3-band; **effective band-table resolution** `calibrated ?? baseline` with boundaries+scores together; **conservativeBandTable()** operator; round-half-to-even at composite; derived-component/missing-primitive renormalization; calibration staging; min-rank overrides), 9 subsegments × 9 business-model-archetype calibration, hybrid/multi-subsegment resolution, evidence — implements `SectorPlugin`.
- **Ontology registration** — 8-dimension metadata (Conviction, Confidence, Quality, Growth, Risk, Profitability, Capital Efficiency, Valuation) for CSIP with **zero CSIP change**.
- **Reuses the platform unchanged** — 0 platform/framework/engine modifications.
- **Eleven-plugin coexistence:** 9 sector engines + CSIP + Technology.

## Frozen specification version

- IES-015 v1.0 (frozen, tag `ies-015-v1.0.0`) + IES-005 / IES-005.1 contracts
- Consumes frozen Technology reference assets read-only (calibration 1.0.0, golden 13, expected 13, fixtures 21)

## Compatibility

- Sector-neutral platform reused — no platform change
- Coexists with the nine released engines + CSIP
- CSIP ontology compatible (zero change)

## Known limitations

- R&D intensity (TM-009) is inherently 3-band (no 4th band invented).
- Qualitative dimensions (retention/usage growth/competitive position) are calibration-dependent.
- Subsegment cyclicality (semiconductors/hardware capital intensity) handled via calibration.

## Verification

- `tsc --noEmit --strict` clean
- **270/270 tests pass**
- All 13 frozen Technology outputs reproduced exactly from a clean git clone (D15 v1.3 contract)
- 13/13 provider validation fixtures accepted (21 total incl. 8 contract-edge in the contract matrix)
- Contract boundary matrix passed
- Independent clean-clone verification passed

## Roadmap

- Technology v1.1/v2.0 via versioned methodology changes
- **Program v1.1 Final Certification** (program-level, cross-sector) → `program-v1.1.0` LTS release, then Program v2.0 architecture evolution. See `program-v1.1-certification/`.
