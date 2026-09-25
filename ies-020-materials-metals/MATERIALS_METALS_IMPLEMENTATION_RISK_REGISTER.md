# IES-020 — Materials & Metals Implementation Risk Register

| # | Risk | Severity | Mitigation | Proof |
|---|---|---|---|---|
| 1 | Engine/oracle float divergence | HIGH | Identical IEEE-754 arithmetic + identical left-to-right summation order | 13/13 composites byte-exact |
| 2 | Pillar display-precision divergence (Python round vs JS) | MEDIUM | Round-half-to-even at 1dp in the test equals the oracle's `round(v,1)` | Pillar equality exact for all 13 |
| 3 | Two-factory drift (runtime vs admin) | HIGH | Both ENGINE_FACTORY registries updated in the same increment | Admin 13/13; runtime 13 sectors |
| 4 | Replay-baseline schema mismatch | HIGH | 13th entry mirrors the existing 9-key sector shape exactly | `computeCertifiedPlatform` executes 13 engines |
| 5 | Fabricated golden data | CRITICAL | Golden data is the frozen D20 artifact (SHA256 verified byte-exact) | SHA256 match on materialization |
| 6 | Confidence null-honesty regression | MEDIUM | G5 Option-A analog: internal plumbing 0.8 only; transport `golden ?? null` | Governed output null → "unavailable" |
| 7 | Cross-engine regression (CSIP, universe, admin) | MEDIUM | Zero CSIP change; full frontend suite + typechecks + build | 326/21/347 preserved |
| 8 | Accidental frontend expansion | MEDIUM | No `frontend/src/**` changes; auto-extension only | Forbidden-path diff empty |
