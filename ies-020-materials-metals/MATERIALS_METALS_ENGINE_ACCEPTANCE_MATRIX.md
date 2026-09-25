# IES-020 — Materials & Metals Engine Acceptance Matrix

**Standard:** IES-020 · **Contract:** D20 v1.0 (M1–M15 ACCEPTED) · **Engine:** `sector.materials-metals` / `Materials & Metals`.

| # | Gate | Result |
|---|---|---|
| 1 | 13/13 frozen expected outputs reproduced (composite + verdict + overrides + subsegment + archetype) | PASS |
| 2 | Pillars match frozen expected outputs (round-half-to-even at 1dp) | PASS |
| 3 | Effective band-table resolution (calibrated ?? baseline, cardinality invariant) | PASS |
| 4 | Round-half-to-even (MM-010: 63.25 → 63.2) | PASS |
| 5 | Multi-subsegment + hybrid resolution (MM-009) | PASS |
| 6 | Override / min-rank (governance→Avoid; tailings-failure etc.→Watch) | PASS |
| 7 | Missing-data renormalization (MM-014: capitalEfficiency 0.0, never fabricated) | PASS |
| 8 | Calibrated band-boundary semantics (MM-015) | PASS |
| 9 | All 6 verdict bands exercised | PASS |
| 10 | Ontology 8/8 dimensions (CSIP-compatible) | PASS |
| 11 | Evidence complete + replay deterministic | PASS |
| 12 | Leverage alerts + archetype risk applied (MM-006/MM-003) | PASS |
| 13 | Golden regression from the delivery unit (13/13) | PASS |
| 14 | Replay byte-identical across repeated runs | PASS |
| 15 | Replay-dataset integrity (13/13, byte-identical markers) | PASS |
| 16 | Calibration integrity (12 band tables · 5 subsegments · 6 archetypes · 6 verdict bands) | PASS |

**Confidence (G5 — Option-A analog, recorded):** internal `EvidencePipeline.build(confidence: 0.8)` plumbing only; engine metadata carries no confidence; governed transport output is `null → "unavailable"` (golden expected outputs carry no confidence).
