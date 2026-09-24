# IES-008 — Capital Markets Implementation Reuse Report

**Repository:** `iips-platform`
**Date:** 2026-08-06
**Purpose:** Records what was reused vs created for the Capital Markets engine — a reuse KPI (per the platform asset template).

---

## 1. Reuse metrics

| Category | Count |
|---|---|
| Platform files reused unchanged | ~20 (runtime, infrastructure, contracts, registries, replay, transport core) |
| Framework services reused | 6 (Manifest, Evidence, Transport, Diagnostics, Qualification, Activation) |
| New sector-specific files | 6 modules + engine + 4 frozen-asset files |
| **Platform modifications required** | **0** |

## 2. Platform files reused (no modification)

- `src/runtime/`, `src/plugin-loader/`, `src/registry/`, `src/snapshot/`, `src/replay/`, `src/di/`, `src/infrastructure/`, `src/framework/*` — all reused unchanged.

## 3. New sector-specific files

- `src/sector-engines/capital-markets/` (metrics, scoring, calibration, decision, evidence, engine, index, 4 frozen assets)

## 4. Platform modifications

**0** — validated by WP-1 (reuse) + WP-2 (framework integration) + git status (only capital-markets files added).

## 5. KPI

Reuse ratio is high; nearly all engineering effort was in the sector methodology (WP-3), with zero platform evolution — consistent with Banking and Insurance.
