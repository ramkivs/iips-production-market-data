# Release Notes — Healthcare Engine v1.0.0 (Platform/Implementation Repository)

**Tag:** `healthcare-engine-v1.0.0`
**Release date:** 2026-08-06
**Status:** Production release (promoted from `healthcare-engine-rc-1.0.0` after independent verification)

---

## Major capabilities

- **Healthcare Engine** (`sector.healthcare`): metrics (HC-001…HC-012), scoring + **clinical-quality constraint**, calibration, decision + overrides + precedence, evidence — implements `SectorPlugin`
- **Reuses the platform unchanged** — 0 platform modifications
- **Four-sector coexistence:** Banking + Insurance + Capital Markets + Healthcare in the same runtime/framework

## Frozen specification version

- IES-009 v1.0 (frozen) + IES-005 / IES-005.1 contracts
- Consumes frozen Healthcare reference assets read-only

## Compatibility

- Sector-neutral platform reused — no platform change
- Coexists with Banking, Insurance, Capital Markets

## Known limitations

- Sub-sector-specific calibration available via Sector Profile/matrices; base profile is default
- No performance optimization (replay-first, per governance)

## Verification

- `tsc --noEmit --strict` clean
- 74/74 tests pass
- All 7 frozen Healthcare outputs reproduced exactly from a clean git clone
- 7 validation fixtures accepted (incl. clinical-quality constraint → Avoid)

## Roadmap

- Healthcare v1.1/v2.0 via versioned methodology changes
- Program v1.1 (future sectors)
