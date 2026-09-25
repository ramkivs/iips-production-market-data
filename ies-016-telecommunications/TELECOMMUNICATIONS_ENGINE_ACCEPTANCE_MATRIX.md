# IES-016 — Telecommunications Engine Acceptance Matrix

**Standard:** IES-016 · **Contract:** D16 v1.0 (M1–M15 ACCEPTED) · **Engine:** `sector.telecommunications` / `Telecommunications`.

| # | Gate | Result |
|---|---|---|
| 1 | 13/13 frozen expected outputs reproduced (composite + verdict + overrides + subsegment + archetype) | PASS |
| 2 | Pillars match frozen expected outputs (round-half-to-even at 1dp) | PASS |
| 3 | Effective band-table resolution (calibrated ?? baseline, cardinality invariant) | PASS |
| 4 | Round-half-to-even (TC-012: 55.05 → 55.0) | PASS |
| 5 | Multi-subsegment + hybrid resolution (TC-009) | PASS |
| 6 | Override / min-rank (governance→Avoid; leverage-breach etc.→Watch) | PASS |
| 7 | Missing-data renormalization (TC-014: capitalEfficiency 0.0, never fabricated) | PASS |
| 8 | Band-boundary semantics (TC-015 lower-inclusive/upper-exclusive) | PASS |
| 9 | All 6 verdict bands exercised | PASS |
| 10 | Ontology 8/8 dimensions (CSIP-compatible) | PASS |
| 11 | Evidence complete + replay deterministic | PASS |
| 12 | Leverage alerts + archetype risk applied (TC-005/TC-006) | PASS |
| 13 | Golden regression from the delivery unit (13/13) | PASS |
| 14 | Replay byte-identical across repeated runs | PASS |
| 15 | Replay-dataset integrity (13/13, byte-identical markers) | PASS |
| 16 | Calibration integrity (12 band tables · 5 subsegments · 6 archetypes · 6 verdict bands) | PASS |

**Confidence (Option A — maintainer decision):** internal `EvidencePipeline.build(confidence: 0.8)` plumbing only; engine metadata carries no confidence; governed transport output is `null → "unavailable"` (golden expected outputs carry no confidence).
