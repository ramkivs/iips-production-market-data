# IIPS Platform — Implementation API Baseline

**Repository:** `iips-platform`
**Status:** FROZEN (implementation-facing API baseline for WP-3 and beyond)
**Date:** 2026-08-06
**Purpose:** Enumerates the public interfaces that the Banking Engine (WP-3) and future sector engines are **allowed** to consume. WP-3 must consume these interfaces rather than bypassing them.

---

## 1. Frozen public interfaces (WP-3 consumption surface)

| Interface | Module | Role |
|---|---|---|
| `RuntimeCoordinator` | `src/runtime/RuntimeCoordinator.ts` | execution orchestration + lifecycle |
| `PluginLoader` | `src/plugin-loader/PluginLoader.ts` | plugin discovery/registration/execution |
| `SectorPlugin` (contract) | `src/plugin-loader/PluginContract.ts` | the plugin contract engines implement |
| `RegistryManager` | `src/registry/RegistryManager.ts` | six immutable registries |
| `SnapshotService` | `src/snapshot/SnapshotService.ts` | immutable snapshot creation |
| `SnapshotStore` | `src/snapshot/SnapshotStore.ts` | append-only snapshot store |
| `ReplayService` | `src/replay/ReplayService.ts` | replay reproduction |
| `EvidencePipeline` | `src/framework/evidence/EvidencePipeline.ts` | evidence package building |
| `ManifestLoader` | `src/framework/manifest/ManifestLoader.ts` | manifest validation/loading |
| `Transport` | `src/framework/transport/Transport.ts` | transport DTO + serialization |
| `DiagnosticsService` | `src/framework/diagnostics/DiagnosticsService.ts` | observational diagnostics |
| `QualificationService` | `src/framework/qualification/QualificationService.ts` | production qualification |
| `ActivationService` | `src/framework/activation/ActivationService.ts` | activation transitions |
| `Container` (DI) | `src/di/Container.ts` | dependency injection |
| `Clock` / `IdProvider` / `deepFreeze` | `src/infrastructure/` | determinism + immutability primitives |

## 2. WP-3 consumption rules (normative)

- WP-3 (Banking Engine) **must** implement the `SectorPlugin` contract and consume the interfaces above.
- WP-3 **must not**:
  - bypass `RuntimeCoordinator` / `PluginLoader`;
  - re-implement registry, snapshot, replay, transport, evidence, diagnostics, qualification, or activation;
  - embed calibration constants in code (must load from frozen calibration profile);
  - introduce `Math.random`/`Date.now` in business logic.
- **Frozen layers must not be modified** by WP-3: runtime, framework, contracts, schemas, transport, platform services. If WP-3 discovers a need to change a frozen layer, **stop and raise an architecture issue** — do not change it directly.

## 3. Frozen specification consumed by WP-3

- IES-006 v1.0 (frozen) — Banking methodology
- `ies-006.1-reference-assets/` (frozen):
  - `calibration/banking-calibration-1.0.0.json`
  - `calibration/BANKING_CALCULATION_APPENDIX.md` (Metric→Band→Score→Pillar→Composite→Verdict)
  - `datasets/banking-golden-reference-1.0.0.json`
  - `expected-outputs/banking-expected-outputs-1.0.0.json`
  - `fixtures/banking-validation-fixtures-1.0.0.json`

## 4. Change procedure

- Any change to this baseline is a versioned, review-gated event.
- Banking-specific code never alters this baseline.
