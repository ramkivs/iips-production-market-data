# IIPS Platform — Implementation Decisions

**Repository:** `iips-platform`
**Purpose:** Records implementation-specific engineering decisions (distinct from engineering-standard ADRs). These belong to the implementation repository, not the engineering standards.
**Status:** Living document — updated as decisions are made.
**Date:** 2026-08-06

---

## ID-001 — Language & runtime

- **Decision:** TypeScript (strict), Node.js, CommonJS modules, ES2020 target.
- **Rationale:** The frozen IES-005.1 contracts are TypeScript-first; strict TS gives compile-time contract enforcement (`tsc --noEmit --strict`).

## ID-002 — Folder organization

- **Decision:**
  ```
  src/
    infrastructure/   (Clock, IdProvider, deepFreeze)
    di/               (Container)
    plugin-loader/    (PluginContract, PluginLoader)
    registry/         (RegistryManager)
    snapshot/         (SnapshotService, SnapshotStore)
    replay/           (ReplayService)
    runtime/          (RuntimeCoordinator)
    framework/        (evidence, manifest, transport, diagnostics, qualification, activation — WP-2)
    sector-engines/   (banking, insurance, ... — WP-3)
  ```
- **Rationale:** Mirrors the IES-005 package organization; sector-neutral core separated from sector engines.

## ID-003 — Testing framework

- **Decision:** Node's built-in test runner (`node:test` + `tsx --test`).
- **Rationale:** Zero extra runtime dependency; deterministic; integrated with TS via `tsx`.

## ID-004 — Build tooling

- **Decision:** TypeScript compiler only (`tsc --noEmit` for typecheck); `tsx` for executing TS.
- **Rationale:** No bundler needed for a library/engine package; keeps the toolchain minimal.

## ID-005 — Serialization

- **Decision:** Native `JSON.stringify` with deterministic key ordering for transport/snapshot checksums.
- **Rationale:** Avoids external serialization library; determinism achieved by explicit ordering.

## ID-006 — Logging / diagnostics

- **Decision:** A minimal `DiagnosticsService` that is observational only (never influences behaviour); no external logging framework in v1.
- **Rationale:** IES-005 P4 §13 mandates observability without influence; avoid dependency until needed.

## ID-007 — Determinism primitives

- **Decision:** `Clock` + `IdProvider` abstractions with `FixedClock`/`DeterministicIdProvider` defaults; no `Math.random`/`Date.now` in business logic.
- **Rationale:** IES-005 P4 §5 + ADR-005; enables replay/certification/audit.

## ID-008 — Immutability

- **Decision:** `deepFreeze` on registries, snapshots, evidence, and profiles; immutable `as const` where possible.
- **Rationale:** IES-005 ADR-003/ADR-010 (immutable registries/snapshots).

## ID-009 — Repository separation

- **Decision:** Implementation lives in `iips-platform`; specification lives in `iips-engineering-standards`. Never mixed.
- **Rationale:** Standards = the truth (frozen); implementation = what implements it.

## ID-010 — Stub plugin pattern

- **Decision:** WP-1 uses minimal stub plugins (no domain logic) to validate the runtime; two stubs coexist to prove multi-sector hosting.
- **Rationale:** Validates the platform before any sector logic.

---

## Change procedure

- Any decision change is recorded here with a new ID; historical decisions are never rewritten.
- Implementation decisions do **not** alter engineering standards; methodology/contract changes require a standard-level version change.
