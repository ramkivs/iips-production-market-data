# IES-016 — TELECOMMUNICATIONS SECTOR ENGINE
# SPECIFICATION & DISCOVERY PACK (v1.0)

**Workstream:** IIPS v3.0 Engine Certification Program (first milestone after N+ series closure at N+22).
**Document type:** PROPOSED SPECIFICATION (normative contract D16 v1.0) — awaiting maintainer/domain-authority acceptance. No engine implementation. NOT yet authoritative.
**Baseline anchor:** canonical `c3041aa6f72c2d2c712730ca72efec07a1a88d35` (`fix: report null portfolio confidence honestly (N+21)`).
**Reference template:** delivered IES-015 Technology engine (`iips-platform/src/sector-engines/technology/`) — the declared reusable format for all future sector standards (IES-016+).
**Status:** PROPOSED SPECIFICATION — supersedes the "SPECIFICATION GAPS" blocking state of `/home/user/IIPS-IES-016-DISCOVERY.md` §20 once accepted. Engine implementation remains NOT authorized.

---

## 0. Document control

| Attribute | Value |
|---|---|
| Standard | IES-016 |
| Contract version | D16 v1.0 (normative) |
| Engine ID | `sector.telecommunications` |
| SectorFamily | `Telecommunications` |
| Engine version | `1.0.0` |
| sec/semc version | `1.0` / `1.0` |
| Program | v3.0 Engine Certification Program |
| Roadmap authority | v1.0 §7.3/§8/§9/§16; Amendment v1.1 §1/§B/§C/§D/§F |
| Data authority | **PENDING — maintainer acceptance required.** The frozen reference providers are PROPOSED synthetic fixtures (IES-015 convention), NOT authoritative until the D16 methodology is approved by the maintainer/domain authority |

---

## 1. Strategic context & purpose

Telecommunications is the first pending engine in the Engine Certification Program (Amendment v1.1 §C: IES-016 = CURRENT PENDING). It must deliver a **real, deterministic sector engine** that:

1. follows the **19-stage engine lifecycle** (v1.0 §8) exactly as the delivered 10 engines did;
2. reproduces a **frozen expected-outputs set** byte-identically (deterministic replay);
3. registers into the **governed universe with zero CSIP / platform / framework change** (the ontology-registration contract);
4. extends the governed API + admin registry + UI **automatically** (payload-driven surfaces).

The reference implementation is **IES-015 Technology** — it exercised the most complete contract mechanisms (per-subsegment calibrated band tables, hybrid/multi-subsegment resolution, deterministic overrides, replay binding, 8-dimension ontology, round-half-to-even) and is documented as reusable for IES-016+ (`ies-015-technology/IES-015_COMPATIBILITY.md`).

---

## 2. Engine identity & registration

| Attribute | Value | Evidence source |
|---|---|---|
| `engineId` | `sector.telecommunications` | mirrors `sector.technology` (TechnologyEngine.ts) |
| `sectorFamily` | `Telecommunications` | Amendment v1.1 §1/§C naming |
| `engineVersion` | `1.0.0` | all 10 delivered engines |
| capabilities | `metrics, scoring, calibration, decision, evidence, ontology` | Technology manifest |
| compatibility | `{ framework: '1.0', methodology: 'IES-016 v1.0' }` | Technology manifest pattern |

---

## 3. Normative calculation contract (D16 v1.0)

### 3.1 Input contract — metric taxonomy (TC-001 … TC-012)

| Code | Field | Unit | Interpretation | Direction |
|---|---|---|---|---|
| TC-001 | `ebitdaMargin` | % | EBITDA margin | higher-better |
| TC-002 | `revenueGrowth` | % | Service revenue growth (YoY) | higher-better |
| TC-003 | `debtEbitda` | × | Net debt / EBITDA | lower-better |
| TC-004 | `arpu` | USD/month | Blended recurring revenue per subscriber-equivalent (per-site for tower-infra) | higher-better |
| TC-005 | `churnRate` | %/year | Subscriber/tenant churn | lower-better |
| TC-006 | `postpaidMix` | % | Postpaid / contracted-revenue share | higher-better |
| TC-007 | `fcfYield` | % | Free cash flow yield | higher-better |
| TC-008 | `roic` | % | Return on invested capital | higher-better |
| TC-009 | `capexIntensity` | % | Capex / revenue | lower-better |
| TC-010 | `spectrumCost` | USD/pop | Spectrum cost per population | lower-better |
| TC-011 | `evEbitda` | × | Enterprise value / EBITDA | lower-better |
| TC-012 | `usageGrowth` | % | Mobile data-traffic growth (YoY) | higher-better |

**Nullability:** every metric is optional (`undefined`/`null` = missing primitive). A missing metric is **dropped** from its pillar and the remaining weights are renormalized; a pillar with zero available metrics is `0.0` (never fabricated, never `NaN`). This mirrors IES-015 `renorm`.

**Override flags (booleans, optional):** `governance`, `regulatoryRisk`, `competitionPressure`, `subscriberCollapse`, `capexOverrun`, `marginCompression`.

### 3.2 Subsegment taxonomy

| Subsegment | Description |
|---|---|
| `wireless-mno` | Wireless mobile network operator |
| `fixed-broadband` | Fixed-line / broadband ISP |
| `converged-telco` | Integrated fixed + mobile operator |
| `cable-mso` | Cable multi-service operator |
| `tower-infra` | Tower / neutral-host network infrastructure |

### 3.3 Archetype taxonomy

`consumer`, `enterprise`, `wholesale`, `infrastructure`, `converged`, `hybrid`.

### 3.4 Resolution (D16 §4 — mirrors IES-015 D15)

- Single `subsegment` → that subsegment.
- `subsegments[]` (multi) + `subsegmentDominant` in set → dominant.
- Multi without dominant → **most-conservative risk profile** (highest `leverageAlert`; tie-break lexicographic smallest id).
- Archetype `hybrid` → `hybridDominant` (default `hybrid`).

### 3.5 Band scoring + effective band-table resolution (D16 §6)

Each metric has a baseline band table in the frozen calibration (`bandScores`). A subsegment may carry a **calibrated band table** (`calibratedBandTables[subsegment][metric]`) that supersedes the baseline **boundaries AND scores together**, **only if** its band cardinality equals the baseline's (cardinality invariant — a cardinality defect rejects the calibrated table and falls back to baseline, never mixing boundaries with scores). Bands are **lower-inclusive / upper-exclusive**; the terminal band includes its upper bound.

### 3.6 Pillar composition (D16 §7)

| Pillar | Composition (weights renormalize over available metrics) |
|---|---|
| `quality` | TC-006 (0.35) + TC-004 (0.35) + TC-005 (0.30) |
| `growth` | TC-002 (0.50) + TC-012 (0.50) |
| `risk` | TC-003 (0.40) + TC-010 (0.35) + TC-009 (0.25) |
| `profitability` | TC-001 (0.55) + TC-008 (0.45) |
| `capitalEfficiency` | TC-007 (1.00) |
| `valuation` | TC-011 (1.00) |

### 3.7 Composite (D16 §8)

```text
composite = roundHalfToEven(
    quality*w0 + growth*w1 + risk*(w2 × archetypeRisk) + profitability*w3
  + capitalEfficiency*w4 + valuation*w5
)
```

- `w` = the resolved subsegment's 6-dimension weight vector (see calibration).
- `archetypeRisk` scales the risk weight (see calibration).
- `roundHalfToEven` rounds to **1 decimal place**, ties-to-even (applied at the composite only; pillars stay full-precision). Determinism requirement: IEEE-754 double arithmetic with **left-to-right summation in the exact order above** — the engine must match the reference oracle bit-for-bit.

### 3.8 Verdict mapping (D16 §9)

```text
80–100 Strong Buy · 70–80 Buy · 60–70 Accumulate · 50–60 Hold · 40–50 Watch · 0–40 Avoid
```

### 3.9 Overrides (D16 §10 — min-rank)

```text
finalVerdict = min_rank(baseVerdict, all applicable override caps)
```
Caps: `governance` → Avoid; `regulatory-risk`, `competition-pressure`, `subscriber-collapse`, `capex-overrun`, `margin-compression`, `leverage-breach` → Watch. `leverage-breach` applies automatically when `debtEbitda >= subsegment.leverageAlert`. Rank order: Strong Buy 6 > Buy 5 > Accumulate 4 > Hold 3 > Watch 2 > Avoid 1.

---

## 4. Calibration contract (frozen, immutable — PROPOSED; NOT authoritative until maintainer approval)

**Frozen ≠ authoritative.** The calibration values below are proposals awaiting maintainer/domain-authority acceptance. Once accepted they may be frozen (immutable) for certification purposes; until then they carry no authority. File: `calibration/telecommunications-calibration-1.0.0.json` (deep-frozen at load; mirrors TechnologyCalibration).

- `bandScores` — 12 baseline band tables (see §3.5).
- `segments` — per-subsegment `w` (6 weights summing to 1.0) + `leverageAlert`:
  - wireless-mno `[0.30,0.20,0.20,0.15,0.10,0.05]` alert 3.5
  - fixed-broadband `[0.30,0.15,0.20,0.20,0.10,0.05]` alert 3.0
  - converged-telco `[0.25,0.20,0.25,0.15,0.10,0.05]` alert 3.5
  - cable-mso `[0.25,0.15,0.25,0.20,0.10,0.05]` alert 4.0
  - tower-infra `[0.30,0.10,0.25,0.20,0.10,0.05]` alert 5.0
- `archetypeRisk` — consumer 1.0, enterprise 0.9, wholesale 0.9, infrastructure 0.8, converged 1.0, hybrid 1.0.
- `calibratedBandTables` — fixed-broadband `TC-004` (higher ARPU scale); tower-infra `TC-004` (per-site recurring revenue scale) + `TC-011` (infra premium multiple).
- `verdictMapping` — §3.8.

---

## 5. Evidence / provenance contract

Mirrors IES-015 `TechnologyEvidence`: evidence package per execution with `engineId: sector.telecommunications`, recommendation = final verdict, compositeScore, supporting scores = quality/growth/risk/profitability, `decisionRulesApplied` = override list, calibrationVersion, replayReference = snapshot id, provenance (`frameworkVersion 1.0`, `engineVersion 1.0.0`, `methodologyVersion 'IES-016 v1.0'`). **Confidence is NOT fabricated by the engine**: golden expected-outputs may omit confidence → the transport reports `null` → UI renders "unavailable" (N+20/N+21 null-honesty contract).

---

## 6. Ontology registration (CSIP)

File: `telecommunications-ontology-metadata-1.0.0.json` — registers the 8-dimension mapping (Conviction/Confidence/Quality/Growth/Risk/Profitability/Capital Efficiency/Valuation). Because the engine exposes the **standard pillar keys** (`quality`, `risk`, `growth`, `profitability`, `capitalEfficiency`, `valuation`), the transport's `csipInputs` fallback and the OntologyMapper fallback consume it with **zero CSIP / transport-logic change** (verified in `/home/user/IIPS-IES-016-DISCOVERY.md` §12–§14).

---

## 7. Golden reference dataset, expected outputs, replay dataset, validation fixtures

### 7.1 Golden reference (13 providers) — `fixtures/telecommunications-golden-reference-1.0.0.json`

Synthetic deterministic reference providers (the frozen Replay-Baseline reference-dataset convention established by IES-015 TE-001…TE-013 — **not claims about real companies**).

### 7.2 Expected outputs (generator-derived; the certification oracle)

Reference oracle: `contract-tests/generate_expected_outputs.py` (implements D16 exactly; no random/time sources). Generated: `expected-outputs/telecommunications-expected-outputs-1.0.0.json` and `replay-datasets/telecommunications-replay-dataset-1.0.0.json`.

| Provider | Subsegment | Archetype | Composite | Verdict | Overrides |
|---|---|---|---|---|---|
| TC-001 National Wireless Leader | wireless-mno | consumer | 77.8 | Buy | — |
| TC-002 Fixed-Line Broadband ISP | fixed-broadband | enterprise | 71.4 | Buy | — |
| TC-003 Converged Telecom Group | converged-telco | converged | 70.0 | Buy | — |
| TC-004 Cable MSO Operator | cable-mso | wholesale | 74.5 | Buy | — |
| TC-005 Tower Infrastructure REIT | tower-infra | infrastructure | 69.6 | Accumulate | — |
| TC-006 Challenger Mobile Operator | wireless-mno | consumer | 60.5 | Watch | leverage-breach, competition-pressure, margin-compression |
| TC-007 Enterprise Fiber & Data Center | fixed-broadband | enterprise | 80.0 | Strong Buy | — |
| TC-008 Regional Cable MSO (sub-scale) | cable-mso | wholesale | 65.1 | Accumulate | — |
| TC-009 Converged Hybrid (multi-subsegment) | wireless-mno (resolved) | converged (hybridDominant) | 68.4 | Accumulate | — |
| TC-010 Sub-scale Fixed Operator | fixed-broadband | enterprise | 62.7 | Accumulate | — |
| TC-011 Governance-Risk Operator | wireless-mno | consumer | 38.6 | Avoid | leverage-breach, governance |
| TC-012 Half-Even Boundary Operator | wireless-mno | consumer | 55.0 | Hold | — (raw 55.05 → 55.0, ties-to-even) |
| TC-013 Stressed Fixed Operator | fixed-broadband | enterprise | 49.5 | Watch | — |

Coverage: all 6 verdict bands; multi-subsegment resolution (TC-009); hybrid archetype (TC-009); subsegment-calibrated band tables (TC-002/TC-005/TC-007/TC-010/TC-013 fixed-broadband ARPU; TC-005 tower ARPU + EV/EBITDA); leverage-breach (TC-006, TC-011); governance → Avoid (TC-011); round-half-to-even tie (TC-012).

### 7.3 Validation fixtures — `fixtures/telecommunications-validation-fixtures-1.0.0.json`

- **TC-014 Missing Primitive**: TC-001 minus `fcfYield` → `capitalEfficiency` = 0.0 (renorm empty), composite 70.3 (Buy) — proves no fabrication on missing input.
- **TC-015 Exact Band Boundaries**: every input on a band edge → lower-inclusive/upper-exclusive semantics (composite 68.2, Accumulate).

---

## 8. Data authority / no-fabrication statement (authority PENDING maintainer acceptance)

- All engine outputs are **computed deterministically** from the frozen calibration + frozen reference inputs (no random, no clock, no external data at execution time).
- **No fabricated scores, confidence, golden outputs, calibration constants, companies, or sector data.** The 13 reference providers are explicitly synthetic deterministic fixtures (IES-015 convention), never presented as real companies.
- Missing primitive → dropped + renormalized (never `0` unless the whole pillar is empty); null confidence → `null` → UI "unavailable".
- The generator is the **reference oracle**; the engine must reproduce its outputs exactly (same IEEE-754 arithmetic, same summation order).

---

## 9. Integration contract (materialized only under engine implementation authorization)

| Integration point | File | Change |
|---|---|---|
| Engine registry (runtime) | `frontend/server/executive-transport.ts` (ENGINE_FACTORY ~:52-64) | + import + `[TELECOMMUNICATIONS_ENGINE_ID]: () => new TelecommunicationsEngine()` |
| Engine registry (admin) | `frontend/server/admin-transport.ts` (ENGINE_FACTORY ~:48-60) | + import + factory entry (admin imports at ~:37-46) |
| Replay baseline | `program-v1.1-certification/PROGRAM_v1.1_REPLAY_BASELINE.json` | + 11th sector entry (`sector: "Telecommunications"`, `engineId: "sector.telecommunications"`, `input: {...}`) |
| Sector directory | `frontend/server/executive-transport.ts` `SECTOR_DIR` ~:73-77 | + `Telecommunications: 'telecommunications'` |
| Golden outputs | `iips-platform/src/sector-engines/telecommunications/telecommunications-expected-outputs-1.0.0.json` | new (generator-derived **certification artifact** — its authority derives solely from an approved D16 methodology; it is NOT itself an authority) |
| Admin registration | auto (`Object.keys(ENGINE_FACTORY)`) | 10 → 11 registered / certified (no code) |
| Transport/API | generic `/api/company|evidence|replay/:sector` | auto (no new endpoint) |
| CSIP | ontology metadata registration | auto (no CSIP change) |
| UI | decision-matrix universe + hubs + selector | auto (payload-driven; no frontend change) |

---

## 10. Acceptance gates (certification evidence — §F pattern)

```text
[ ] Engine reproduces the 13 frozen expected outputs byte-identically (composite + verdict + overrides)
[ ] Replay: every provider reproduces with byteIdentical: true (deterministic)
[ ] Round-half-to-even proven on TC-012 (55.05 -> 55.0, ties-to-even)
[ ] Missing-primitive proven on TC-014 (renormalize; never fabricated)
[ ] Band-boundary semantics proven on TC-015 (lower-inclusive / upper-exclusive)
[ ] Engine registers in both ENGINE_FACTORY registries; admin shows 11 registered / 11 certified
[ ] /api/company|evidence|replay/Telecommunications serve the 11th sector (Bearer + read-RBAC; 401/403)
[ ] CSIP participates via ontology metadata (zero CSIP code change)
[ ] UI universe/hubs/selector include Telecommunications (zero frontend change)
[ ] Null-honesty: no fabricated confidence anywhere (golden may omit -> null -> "unavailable")
[ ] Full suite green (baseline 326/21/347 + new engine regression tests)
[ ] typecheck + typecheck:server + build exit 0; git diff --check clean; forbidden paths empty
[ ] Certification reports + README/ROADMAP status reconciled (IES-016 planned -> delivered)
[ ] No commit/push until promotion authorization
```

---

## 11. Forbidden boundary (unchanged from discovery)

`frontend/src/**` (no frontend change), `iips-platform/src/sector-engines/cross-sector/**` and platform/framework/distributed/runtime/snapshot/replay/plugin-loader (no CSIP/platform change), all other sector engines, auth (`keycloakAdapter`, `secured-executor`), manifests, tsconfig/package/vite configs, historical artifacts, sandbox N+11 files, protected master docs (v1.0 / Amendment v1.1 — updates require separate authorization).

---

## 12. Risk register

| Risk | Severity | Mitigation |
|---|---|---|
| Oracle/engine float divergence | HIGH | Identical IEEE-754 + identical summation order; generator is the byte-exact oracle |
| Two-factory drift (runtime vs admin) | HIGH | Update both registries in the same increment; admin 11/11 proof |
| Replay-baseline schema mismatch | HIGH | Match the existing 10-sector entry shape exactly |
| Fabricated golden data | CRITICAL | Golden data = generator output from the frozen calibration; provenance recorded; never hand-invented |
| Confidence null-honesty regression | MEDIUM | Engine does not set confidence; transport `?? null` (N+20/N+21 contract) |
| Cross-engine regression (CSIP, universe, admin) | MEDIUM | Zero CSIP change; full suite + typechecks + build |
| GATE0 strategic-note tension (historical draft: "do not open IES-016 now") | governance | Surfaced to maintainer in `/home/user/IIPS-IES-016-DISCOVERY.md` §4; maintainer decision governs |

---

## 13. Unresolved / follow-ups

1. **Maintainer acceptance** of this D16 v1.0 methodology (this is a proposal; the maintainer/domain authority is the authority — see the companion `D16_AUTHORITY_REVIEW.md` decision matrix).
2. **Maintainer decision** on the historical GATE0 note vs. Amendment v1.1 §C ("IES-016 CURRENT PENDING").
3. **Sector display name**: `Telecommunications` (roadmap term) — engine dir `telecommunications`.
4. Real-world **live data** for Telecommunications is explicitly **out of scope** — the frozen Replay-Baseline reference dataset convention (as established for all 10 delivered engines by the program's domain authority) applies; the proposed fixtures remain pending that same authority.

---

## 14. Materialization plan

This specification package lives out-of-repo at `/home/user/ies-016-telecommunications/`. Upon **IES-016 ENGINE IMPLEMENTATION AUTHORIZATION**, the following are materialized into the repository (detached worktree at canonical HEAD, per governance):

```text
ies-016-telecommunications/            (this discovery pack + acceptance matrix + risk register + freeze/certification reports)
iips-platform/src/sector-engines/telecommunications/   (engine + calibration + decision + evidence + metrics + scoring + index + 4 JSON artifacts)
iips-platform/tests/regression/telecommunications-*.test.ts
+ the §9 integration-point modifications
```

No engine implementation, no server integration, no frontend change, no factory/baseline change has been performed. This document is specification-only.

---

**IES-016 SPECIFICATION STATUS: PROPOSED (AWAITING MAINTAINER ACCEPTANCE)**
**ENGINE IMPLEMENTATION: NOT AUTHORIZED / NOT EXECUTED**
