# Release Notes — Capital Markets Engine v1.0.0 (Platform/Implementation Repository)

**Tag:** `capital-markets-engine-v1.0.0`
**Release date:** 2026-08-06
**Status:** Production release (promoted from `capital-markets-engine-rc-1.0.0` after independent verification)

---

## Major capabilities

- **Capital Markets Engine** (`sector.capital-markets`): metrics (CM-001…CM-008), scoring, calibration, decision, evidence — implements `SectorPlugin`
- **Reuses the platform unchanged** (runtime, framework, contracts, replay, evidence, validation, governance) — 0 platform modifications
- **Three-sector coexistence:** Banking + Insurance + Capital Markets in the same runtime/framework

## Frozen specification version

- IES-008 v1.0 (frozen) + IES-005 / IES-005.1 contracts
- Consumes frozen Capital Markets reference assets read-only

## Compatibility

- Sector-neutral platform reused — no platform change
- Coexists with Banking + Insurance engines

## Known limitations

- Sub-sector-specific calibration available via Sector Profile/matrices; base profile is the reference-asset default
- No performance optimization (replay-first, per governance)

## Verification

- `tsc --noEmit --strict` clean
- 61/61 tests pass
- All 6 frozen Capital Markets outputs reproduced exactly from a clean git clone
- 8 validation fixtures accepted

## Roadmap

- Capital Markets v1.1/v2.0 via versioned methodology changes
- Future sectors (Healthcare, Energy, etc.) reuse the same platform + lifecycle
