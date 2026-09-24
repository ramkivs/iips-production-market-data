# Release Notes — Banking Engine v1.0.0 (Platform/Implementation Repository)

**Tag:** `banking-engine-v1.0.0`
**Release date:** 2026-08-06
**Status:** Production release (promoted from `banking-engine-rc-1.0.0` after independent verification)

---

## Major capabilities

- **Runtime platform** (sector-neutral): Runtime Coordinator, PluginLoader, SEC contract, Registry Manager (6 registries), Snapshot + Replay, DI, determinism primitives
- **Framework services** (sector-neutral): Evidence Pipeline, Manifest Loader, Transport (generic DTO), Diagnostics, Qualification, Activation
- **Banking Engine**: metrics, scoring, calibration, decision, evidence — implements the `SectorPlugin` contract, consumes platform services
- **Validation**: golden dataset regression (5/5), replay determinism, 7 validation fixtures, independent verification

## Frozen specification version

- IES-006 v1.0 (frozen) + IES-005 / IES-005.1 contracts
- Consumes frozen reference assets read-only

## Compatibility

- Sector-neutral runtime/framework — reusable by Insurance, Capital Markets, Healthcare, and future engines
- Implementation API baseline (`IMPLEMENTATION_API_BASELINE.md`) governs engine consumption

## Known limitations

- Banking v1 pillars Growth/Efficiency/Valuation neutral (50)
- No performance optimization performed (replay-first, per governance)

## Verification

- `tsc --noEmit --strict` clean
- 35/35 tests pass
- All 5 frozen banking outputs reproduced exactly from a clean git clone

## Future roadmap

- Banking v1.1 / v2.0 via versioned methodology changes
- IES-007 — Insurance Sector Engine (reusing platform unchanged)
- Multi-sector engine family on the common platform
