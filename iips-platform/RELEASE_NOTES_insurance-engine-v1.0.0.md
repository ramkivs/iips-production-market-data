# Release Notes — Insurance Engine v1.0.0 (Platform/Implementation Repository)

**Tag:** `insurance-engine-v1.0.0`
**Release date:** 2026-08-06
**Status:** Production release (promoted from `insurance-engine-rc-1.0.0` after independent verification)

---

## Major capabilities

- **Insurance Engine** (`sector.insurance`): metrics (IM-001…IM-008), scoring, calibration, decision, evidence — implements `SectorPlugin`
- **Reuses the Banking-validated platform unchanged** (runtime, framework, contracts, replay, evidence, validation, governance)
- **Multi-sector coexistence:** Banking + Insurance operate through the same runtime/framework without branching

## Frozen specification version

- IES-007 v1.0 (frozen) + IES-005 / IES-005.1 contracts
- Consumes frozen Insurance reference assets read-only

## Compatibility

- Sector-neutral platform reused — no platform contract change required (Phase 2 Contracts Review)
- Coexists with Banking Engine v1.0.0 in the same runtime

## Known limitations

- Insurance v1 pillars follow the frozen D15 basis; sub-sector-specific calibration (Life vs General vs Health) is available via the Sector Profile but not separately calibrated in v1
- No performance optimization performed (replay-first, per governance)

## Verification

- `tsc --noEmit --strict` clean
- 48/48 tests pass
- All 5 frozen Insurance outputs reproduced exactly from a clean git clone
- 8 validation fixtures accepted

## Roadmap

- Insurance v1.1 / v2.0 via versioned methodology changes
- Future sectors (Capital Markets, Healthcare, etc.) reuse the same platform + lifecycle
