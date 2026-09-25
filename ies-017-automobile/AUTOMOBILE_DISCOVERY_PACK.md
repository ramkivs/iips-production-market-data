# IES-017 — AUTOMOBILE SECTOR ENGINE
# SPECIFICATION & DISCOVERY PACK (v1.0)

**Workstream:** IIPS v3.0 Engine Certification Program (IES-016 CLOSED at `9bf91d1`).
**Document type:** **D17 v1.0 SPECIFICATION — METHODOLOGY ACCEPTED** (M1–M15 ACCEPTED + G1–G6 DECIDED, recorded 2026-08-20 in `D17_AUTHORITY_REVIEW.md`). The methodology values below are now the accepted D17 authority. **Engine implementation remains NOT authorized.**
**Baseline anchor:** canonical `9bf91d148a8013e0e51bc0d0c22e70894e0dab15` (`feat: add telecommunications sector to IES-016`).
**Reference template:** certified IES-015 Technology / IES-016 Telecommunications engine (structure only — **Automobile methodology is NOT inherited**).
**Status:** PROPOSED — supersedes the IES-017 "AUTHORITY GAP" STOP state only once the maintainer accepts the D17 methodology via `D17_AUTHORITY_REVIEW.md`.

---

## 0. Document control

| Attribute | Value (PROPOSED) |
|---|---|
| Standard | IES-017 |
| Contract version | D17 v1.0 (normative) — PROPOSED |
| Engine ID | `sector.automobile` |
| SectorFamily | `Automobile` |
| Engine version | `1.0.0` |
| sec/semc version | `1.0` / `1.0` |
| Program | v3.0 Engine Certification Program |
| Roadmap authority | v1.0 §7.3/§8/§9; Amendment v1.1 §1/§B/§C/§D/§F |
| Data authority | **PENDING — maintainer acceptance required.** All fixtures are PROPOSED synthetic (IES-015/016 convention), never presented as real companies. |

---

## 1. Strategic context & purpose

Automobile is the second pending engine (Amendment v1.1 §C). Like IES-016, it must deliver a deterministic sector engine following the 19-stage lifecycle (v1.0 §8), reproducing frozen expected outputs byte-identically, registering into the governed universe with **zero CSIP/platform/framework change**, and extending the governed API/admin/UI automatically.

**IES-016 (D16) methodology does NOT transfer.** The Automobile investment-quality definition below is entirely PROPOSED and requires fresh M1–M15 authority.

---

## 2. Engine identity (PROPOSED)

| Attribute | Value |
|---|---|
| `engineId` | `sector.automobile` |
| `sectorFamily` | `Automobile` |
| capabilities | `metrics, scoring, calibration, decision, evidence, ontology` |
| compatibility | `{ framework: '1.0', methodology: 'IES-017 v1.0' }` |

---

## 3. PROPOSED input contract — metric taxonomy (M1/M2/M3)

| Code | Field | Unit | Interpretation | Direction |
|---|---|---|---|---|
| AB-001 | `ebitdaMargin` | % | EBITDA margin | higher-better |
| AB-002 | `revenueGrowth` | % | Revenue growth (YoY) | higher-better |
| AB-003 | `debtEbitda` | × | Net debt / EBITDA | lower-better |
| AB-004 | `vehicleMargin` | % | Per-vehicle contribution margin | higher-better |
| AB-005 | `capacityUtilization` | % | Plant capacity utilization | higher-better |
| AB-006 | `evMix` | % | EV share of deliveries (transition positioning) | higher-better |
| AB-007 | `fcfYield` | % | Free cash flow yield | higher-better |
| AB-008 | `roic` | % | Return on invested capital | higher-better |
| AB-009 | `capexIntensity` | % | Capex / revenue | lower-better |
| AB-010 | `inventoryDays` | days | Inventory days on hand | lower-better |
| AB-011 | `evEbitda` | × | Enterprise value / EBITDA | lower-better |
| AB-012 | `aftersalesMix` | % | Aftersales / services revenue share | higher-better |

**Nullability (M8, PROPOSED):** every metric optional; a missing primitive is **dropped** from its pillar and remaining weights renormalized; an empty pillar is `0.0` (never fabricated, never `NaN`). Mirrors IES-015/016 `renorm`.

**Override flags (M13, PROPOSED):** `governance`, `recallRisk`, `batteryCostShock`, `demandCollapse`, `capexOverrun`, `marginCompression`, `competitionPressure`.

---

## 4. PROPOSED subsegments (M4) + archetypes (M5)

| Subsegment | Description |
|---|---|
| `mass-market-oem` | Volume vehicle manufacturer |
| `premium-oem` | Premium / luxury manufacturer |
| `ev-native` | EV pure-play manufacturer |
| `commercial-vehicles` | Trucks / commercial vehicles |
| `tier-1-supplier` | Tier-1 parts / systems supplier |

| Archetype | Description |
|---|---|
| `full-line` | Diversified product line |
| `luxury` | Premium focus |
| `ev-pure-play` | EV-only business model |
| `commercial` | Commercial / fleet focus |
| `component-supplier` | Parts / systems supplier |
| `hybrid` | Mixed (resolve via `hybridDominant`) |

**Resolution (PROPOSED, mirrors D15/D16):** single subsegment → itself; multi-subsegment + `subsegmentDominant` → dominant; multi without dominant → most-conservative risk (highest `leverageAlert`, tie-break lexicographic); `hybrid` archetype → `hybridDominant` (default `hybrid`).

---

## 5. PROPOSED scoring / calibration

### Band semantics (M10) — lower-inclusive / upper-exclusive; terminal band includes upper bound; effective band-table resolution = calibrated ?? baseline (cardinality invariant). See `calibration/automobile-calibration-1.0.0.json`.

### Pillar construction (M6) + weights (M7)

| Pillar | Composition (weights renormalize over available metrics) |
|---|---|
| `quality` | AB-004 (0.35) + AB-005 (0.35) + AB-012 (0.30) |
| `growth` | AB-002 (0.50) + AB-006 (0.50) |
| `risk` | AB-003 (0.40) + AB-010 (0.35) + AB-009 (0.25) |
| `profitability` | AB-001 (0.55) + AB-008 (0.45) |
| `capitalEfficiency` | AB-007 (1.00) |
| `valuation` | AB-011 (1.00) |

### Subsegment 6-dim vectors + leverage alerts (M14)

| Subsegment | `w` [quality, growth, risk, profitability, capEff, valuation] | leverageAlert |
|---|---|---|
| mass-market-oem | [0.25, 0.20, 0.25, 0.15, 0.10, 0.05] | 3.0 |
| premium-oem | [0.30, 0.15, 0.20, 0.20, 0.10, 0.05] | 3.5 |
| ev-native | [0.30, 0.25, 0.20, 0.10, 0.10, 0.05] | 3.5 |
| commercial-vehicles | [0.25, 0.15, 0.25, 0.20, 0.10, 0.05] | 3.0 |
| tier-1-supplier | [0.25, 0.20, 0.25, 0.15, 0.10, 0.05] | 3.0 |

### Archetype risk multipliers (M14)

`full-line` 1.0 · `luxury` 0.9 · `ev-pure-play` 1.1 · `commercial` 0.9 · `component-supplier` 0.9 · `hybrid` 1.0.

### Calibrated band tables (M9)

`ev-native` AB-004 (thinner per-vehicle margin) + AB-009 (heavier EV capex); `tier-1-supplier` AB-005 (higher utilization). Full values in the calibration JSON.

### Composite + rounding (M11/M15)

`composite = roundHalfToEven(quality·w0 + growth·w1 + risk·(w2×archetypeRisk) + profitability·w3 + capitalEfficiency·w4 + valuation·w5)` — **left-to-right summation**, round-half-to-even to **1 decimal place**, ties-to-even, composite only (pillars full precision). Deterministic precedence/replay: no random/clock; identical input → identical output/evidence/metadata.

### Verdict bands (M12)

```text
80–100 Strong Buy · 70–80 Buy · 60–70 Accumulate · 50–60 Hold · 40–50 Watch · 0–40 Avoid
```

### Overrides (M13/M14)

`finalVerdict = min_rank(baseVerdict, all applicable override caps)`.
Caps: `governance` → Avoid; `recall-risk`, `battery-cost-shock`, `demand-collapse`, `capex-overrun`, `margin-compression`, `competition-pressure`, `leverage-breach` → Watch.
`leverage-breach` auto-applies when `debtEbitda >= subsegment.leverageAlert`.

---

## 6. PROPOSED evidence / confidence

Mirrors the certified template: evidence package per execution (engineId `sector.automobile`, recommendation = final verdict, compositeScore, supporting scores = quality/growth/risk/profitability, decisionRulesApplied = overrides, calibrationVersion, replayReference, provenance). **Confidence is not fabricated by the engine**; golden expected outputs carry no confidence → governed transport reports `null` → UI "unavailable".

> **Open question (recorded, requires explicit maintainer decision):** the certified platform `EvidencePipeline.build` requires a non-nullable numeric `confidence`. IES-016 resolved this via **Option A** (internal `0.8` plumbing only; metadata absent; governed null). **That decision does NOT auto-transfer to IES-017** — see `D17_AUTHORITY_REVIEW.md` Part D (G-item).

---

## 7. PROPOSED golden reference / expected outputs / replay / fixtures

- **Golden reference (13 PROPOSED synthetic providers):** `fixtures/automobile-golden-reference-1.0.0.json` — AB-001…AB-013 (synthetic deterministic reference providers, IES-015/016 convention; NOT real companies).
- **Reference oracle:** `contract-tests/generate_expected_outputs.py` — deterministic transcription of the PROPOSED D17 contract; **a tool, not an authority**.
- **Expected outputs + replay dataset:** derived artifacts (`expected-outputs/`, `replay-datasets/`) — **not authority**; valid only after methodology approval.

| Provider | Subsegment | Archetype | Composite | Verdict | Overrides |
|---|---|---|---|---|---|
| AB-001 Global Volume OEM | mass-market-oem | full-line | 71.3 | Buy | — |
| AB-002 Premium Luxury Brand | premium-oem | luxury | 74.9 | Buy | — |
| AB-003 Commercial Vehicle Leader | commercial-vehicles | commercial | 69.2 | Accumulate | — |
| AB-004 Global Tier-1 Supplier | tier-1-supplier | component-supplier | 70.6 | Buy | — |
| AB-005 EV Pure-Play Challenger | ev-native | ev-pure-play | 66.9 | Accumulate | — |
| AB-006 Legacy OEM Under Pressure | mass-market-oem | full-line | 56.0 | Watch | leverage-breach, margin-compression, competition-pressure |
| AB-007 Premium EV Leader | premium-oem | ev-pure-play | 83.6 | Strong Buy | — |
| AB-008 Sub-scale Supplier | tier-1-supplier | component-supplier | 56.6 | Hold | — |
| AB-009 Multi-subsegment Hybrid OEM | premium-oem (resolved) | luxury (hybridDominant) | 71.9 | Buy | — |
| AB-010 Half-Even Tie OEM | mass-market-oem | full-line | 56.2 | Hold | — (raw 56.25 → 56.2, ties-to-even) |
| AB-011 Governance-Risk OEM | mass-market-oem | full-line | 39.0 | Avoid | leverage-breach, governance |
| AB-012 Recall + Demand Collapse OEM | premium-oem | luxury | 68.5 | Watch | recall-risk, demand-collapse |
| AB-013 Exact Band Boundaries OEM | commercial-vehicles | commercial | 64.8 | Accumulate | — |

Coverage: all 6 verdict bands; overrides (AB-006/011/012); multi-subsegment + hybrid (AB-009); calibrated bands (AB-005/004/008); genuine ties-to-even (AB-010); band boundaries (AB-013); missing-primitive (AB-014); calibrated-boundary (AB-015) in validation fixtures.

---

## 8. Data authority / no-fabrication statement

- All engine outputs derive deterministically from the PROPOSED frozen calibration + PROPOSED reference inputs (no random/clock/external data).
- **No fabricated scores, confidence, golden outputs, calibration constants, companies, or sector data.** The 13 reference providers are explicitly PROPOSED synthetic fixtures, never presented as real companies.
- Missing primitive → drop + renormalize; null confidence → `null` → "unavailable".
- The generator is the transcription oracle; the engine must reproduce its outputs exactly.

---

## 9. Integration contract (materialized ONLY under future engine-implementation authorization)

| Integration point | Change |
|---|---|
| `frontend/server/executive-transport.ts` ENGINE_FACTORY | + import + `[AUTOMOBILE_ENGINE_ID]: () => new AutomobileEngine()` |
| `frontend/server/admin-transport.ts` ENGINE_FACTORY | + import + factory entry |
| `executive-transport.ts` SECTOR_DIR | + `Automobile: 'automobile'` |
| `PROGRAM_v1.1_REPLAY_BASELINE.json` | + 12th sector entry (append-only) |
| Admin registration | auto 11 → 12 |
| Transport/API/UI | auto (generic endpoints, payload-driven universe) |
| Certification tests | 12 files mechanically 11 → 12 (Track-1/2/6/8 NOT auto-changed) |

---

## 10. Acceptance gates (when/if methodology is approved)

```text
[ ] Engine reproduces the 13 frozen expected outputs byte-identically
[ ] Replay byte-identical; ties-to-even proven on AB-010 (56.25 -> 56.2)
[ ] Missing-primitive (AB-014) and calibrated-boundary (AB-015) proven
[ ] Both ENGINE_FACTORY registries + SECTOR_DIR + replay-baseline 12th entry
[ ] Admin 12 registered / 12 certified; universe = 12; transport null-honest
[ ] Full platform regression (502 + new engine tests); frontend 326/21/347
[ ] typecheck ×2 + build exit 0; git diff --check clean; forbidden paths empty
[ ] Certification reports + README/ROADMAP reconciled
[ ] No commit/push until promotion authorization
```

---

## 11. Forbidden boundary

`frontend/src/**` · CSIP · platform/framework/evidence contract · auth · existing certified engines · lockfiles/package.json · unrelated transports · existing replay-baseline entries · Track-1/2/6/8 10-sector fixtures · historical artifacts · protected master docs.

---

## 12. Risk register (PROPOSED)

| Risk | Severity | Mitigation |
|---|---|---|
| Methodology not yet authority | CRITICAL | Everything PROPOSED; authority review gate before any implementation |
| Fabricated golden data | CRITICAL | Fixtures are PROPOSED synthetic; must be approved by domain authority before certification |
| Evidence confidence contract conflict | HIGH | Requires explicit maintainer decision (Option-A analog) — see D17_AUTHORITY_REVIEW Part D |
| Oracle/engine float divergence | HIGH | Identical IEEE-754 + summation order; byte-exact composite |
| Certification-test 11→12 extension | MEDIUM | 12 files mechanical; Track-1/2/6/8 frozen |
| CSIP/framework drift | HIGH | Zero CSIP/platform/framework change (ontology registration) |

---

## 13. Unresolved / follow-ups

1. **Maintainer acceptance** of M1–M15 (all PENDING in `D17_AUTHORITY_REVIEW.md`).
2. **Confidence decision** (Option-A analog) — explicit IES-017 decision required.
3. **Naming**: sector display `Automobile`, engine dir `automobile`.
4. Live production data out of scope (frozen reference convention).

---

**IES-017 D17 SPECIFICATION STATUS: METHODOLOGY ACCEPTED (M1–M15 + G1–G6, recorded 2026-08-20)**
**ENGINE IMPLEMENTATION: NOT AUTHORIZED**
