# IES-020 — Materials & Metals Sector Engine
# IMPLEMENTATION READINESS CERTIFICATE (v1.0)

**Standard:** IES-020 · **Engine:** `sector.materials-metals` · **sectorFamily:** `Materials & Metals`
**Status:** AUTHORIZED — implementation may begin against the frozen baseline
**Issued:** 2026-08-29
**Issuer:** IIPS Engineering Standards Maintainer
**Contract:** D20 v1.0 (M1–M15 ACCEPTED by the maintainer/domain authority)
**Baseline:** canonical `d51b120b2ac8a524bf088ed8fe80b904c29a628b`

## Certification evidence

| Evidence | Result |
|---|---|
| 13/13 frozen expected outputs reproduced (composite + verdict + overrides + resolution) | PASS |
| Pillars match (round-half-to-even 1dp) | PASS |
| Round-half-to-even boundary (MM-010: 63.25 → 63.2) | PASS |
| Multi-subsegment + hybrid resolution (MM-009) | PASS |
| Overrides min-rank (governance→Avoid; leverage-breach etc.→Watch) | PASS |
| Missing-primitive renormalization (MM-014) | PASS |
| Calibrated band-boundary semantics (MM-015) | PASS |
| Ontology 8/8 (CSIP-compatible, zero CSIP change) | PASS |
| Replay byte-identical (deterministic) | PASS |
| Engine registrations (runtime + admin ENGINE_FACTORY) | 12 → 13 |
| Replay-baseline 13th sector entry | PASS |
| Governed transport/API auto-extension (`/api/company|evidence|replay/Materials & Metals`) | PASS |
| Null-confidence honesty (governed output `null` → "unavailable") | PASS |
| Full platform suite / typecheck / server typecheck / build | PASS (recorded in implementation report) |

## Confidence decision (recorded)

G5 (Option-A analog, maintainer): `confidence: 0.8` is used **only** as the internal `EvidencePipeline.build()` plumbing value required by the certified platform contract. Engine metadata carries no confidence; the governed transport reports `null` for Materials & Metals (golden expected outputs carry no confidence), rendered "unavailable".

## Stop state

Engine implementation + mechanical integration complete; acceptance gates green. **No commit / no push** — promotion is a separate authorization (Windows review gate).
