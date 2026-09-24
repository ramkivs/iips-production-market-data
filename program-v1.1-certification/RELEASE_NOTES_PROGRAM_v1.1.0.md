# Release Notes — Program v1.1.0 (LTS)

**Tag:** `program-v1.1.0`
**Release date:** 2026-08-09
**Status:** **LONG-TERM SUPPORT (LTS)** — certified deterministic multi-sector investment-intelligence foundation

---

## What is released

- **10 released sector engines** (Banking, Insurance, Capital Markets, Healthcare, Hospitality, Energy, Utilities, Consumer, Industrials, Technology) — all `*-engine-v1.0.0`, immutable, zero platform modification.
- **CSIP** (`csip-v1.0.0`) — sector-neutral portfolio intelligence.
- **Platform capabilities** — ARM, Performance baseline (IES-005.2), Observability contract (IES-005.3), CI/CD gates (IES-005.4).
- **Program v1.1 Final Certification** — 9 tracks + Final Readiness Certificate (`program-v1.1-certification/`).
- **Program v1.1 Replay Baseline** and **Performance Baseline** — controlled certification artifacts carried into v2.0.

## Certification summary

- Platform **325/325** · Observability **33/33** · CI/CD **24/24**.
- Zero blocking non-conformances (Track 8).
- Four legacy deviations accepted and deferred to v2.0 (v2.0-R1..R4).

## The v1.1 ↔ v2.0 boundary

- **MUST PRESERVE (v2.0):** deterministic core (`Input → Contract → Calibration → Engine → Evidence → Snapshot → Replay`), sector isolation, plugin contract, frozen-oracle, replay, evidence traceability, CSIP neutrality, no silent methodology changes, backward compatibility.
- **MAY CHANGE (v2.0):** distributed/cloud runtime, live data, enterprise/RBAC, AI, marketplace, workflow, SDK/API, uniform ontology/calibration-version exposure, CSIP `engineVersions` modernization.

## Governance

- Methodology/calibration changes require a new version; breaking changes require a major version + compatibility review.
- Rollback additive-only; frozen artifacts never modified.
- **v2.0 is not yet implemented** — only its architectural boundary/backlog is authorized.
