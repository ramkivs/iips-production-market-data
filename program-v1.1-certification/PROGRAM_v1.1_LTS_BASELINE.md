# Program v1.1 — LTS Baseline (the v1.1.0 Constitution)

**Program:** IIPS Engineering Standards — Program v1.1
**Milestone:** Program v1.1 Final Certification — Track 9 (LTS Baseline)
**Document type:** CONSTITUTION — the frozen v1.1.0 baseline and the v1.1 ↔ v2.0 transition boundary
**Version:** 1.0
**Date:** 2026-08-09
**Predecessor:** Track 8 — Architecture Conformance Audit (Approved)
**Status:** **LTS BASELINE FROZEN** — awaiting Final Program Readiness Certificate → `program-v1.1.0`

---

## 1. Purpose

Program v1.1 has completed all 10 sector engines and all platform capabilities. Track 9 freezes the **Program v1.1 LTS baseline** — the constitutional boundary that v2.0 architecture evolution must respect — and records the accepted legacy deviations as **v2.0 remediation backlog** (not to be changed in v1.1).

## 2. Frozen v1.1 baseline (the LTS surface)

| Category | Frozen artifact(s) |
|---|---|
| Platform contracts | IES-005, IES-005.1 (plugin contract, runtime, framework, snapshot, replay, evidence, manifest, transport, diagnostics, qualification, activation) |
| Platform capabilities | ARM, Performance baseline (IES-005.2), Observability contract (IES-005.3), CI/CD gates (IES-005.4), CSIP v1.0.0 |
| 10 released sector engines | `banking-engine-v1.0.0` · `insurance-engine-v1.0.0` · `capital-markets-engine-v1.0.0` · `healthcare-engine-v1.0.0` · `hospitality-engine-v1.0.0` · `energy-engine-v1.0.0` · `utilities-engine-v1.0.0` · `consumer-engine-v1.0.0` · `industrials-engine-v1.0.0` · `technology-engine-v1.0.0` |
| Sector reference assets | Calibration profiles, golden datasets, expected outputs, replay datasets, validation fixtures, ontology metadata — all frozen per sector |
| **Program v1.1 Replay Baseline** | `program-v1.1-certification/PROGRAM_v1.1_REPLAY_BASELINE.json` |
| **Program v1.1 Performance Baseline** | `program-v1.1-certification/PROGRAM_v1.1_PERFORMANCE_BASELINE.json` |
| Observability contract | Common `ObservabilityPipeline` (IES-005.3) |
| CSIP behavior | Sector-neutral pipeline (common schema/registry/retrieval/intelligence surface) |
| CI/CD gates | 8 stages, 5 hard gates, mutation-sensitive, frozen-oracle validation |
| Architecture invariants | 10×10 audit (Track 8) — no blocking non-conformance |
| Accepted legacy deviations | 4 findings (below), frozen as known v1.1 characteristics |

## 3. Determinism / replay guarantees (must hold in LTS)

- Injectable `Clock`/`IdProvider` only; no `Math.random`/`Date.now` in business logic.
- Replay-identical: same input + contract version + calibration version + runtime configuration → identical output + evidence + metadata + replay.
- Round-half-to-even at composite only; lower-inclusive / upper-exclusive boundaries.
- Frozen oracle discipline: reference assets are the authoritative test oracle; implementation disagreement = implementation defect.

## 4. Accepted legacy deviations (frozen as known v1.1 characteristics — NOT fixed in v1.1)

| # | Deviation | Classification | v2.0 remediation record |
|---|---|---|---|
| 1 | Ontology exposure inconsistency (4 v1.0 engines rely on CSIP mapper) | 🟡/🟠 | v2.0-R1 |
| 2 | CSIP `engineVersions` evidence staleness | 🟠 | v2.0-R2 |
| 3 | Calibration-version exposure (only Technology exposes in metadata) | 🟡/🟠 | v2.0-R3 |
| 4 | Banking frozen-asset layout (`frozen-assets/` subdir) | 🟡 | v2.0-R4 |

## 5. The v1.1 ↔ v2.0 boundary

### MUST PRESERVE in v2.0 (the deterministic investment-intelligence core)

```text
Input → Contract → Calibration → Deterministic Engine → Evidence → Snapshot → Replay
```

- Sector-engine isolation
- Common runtime / plugin contract
- Frozen-oracle discipline
- Deterministic replay
- Evidence traceability
- CSIP sector neutrality
- No silent methodology changes
- Backward-compatibility policy

### MAY CHANGE in v2.0 (legitimate evolution)

- Distributed execution
- Cloud / Kubernetes runtime
- Live market-data ingestion
- Enterprise tenancy / RBAC
- AI assistance (never replacing deterministic scoring)
- Plugin marketplace
- Workflow designer
- Public SDK/API layer
- **Uniform ontology exposure** (v2.0-R1)
- **Uniform calibration-version metadata** (v2.0-R3)
- **CSIP `engineVersions` modernization** (v2.0-R2)

## 6. Versioning & rollback rules (LTS)

- Any methodology/calibration change requires a **new version**, never modification of a frozen baseline.
- Breaking changes require a **major version** + compatibility review.
- Rollback is **additive-only**; released engines and frozen assets are never modified destructively.
- The Program v1.1 Replay/Performance baselines are controlled certification artifacts carried unchanged into v2.0 for regression comparison.

## 7. Status

**LTS BASELINE FROZEN.** Awaiting Final Program Readiness Certificate → `program-v1.1.0` release / LTS.
