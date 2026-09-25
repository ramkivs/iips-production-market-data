# IES-020 — MATERIALS & METALS SECTOR ENGINE
# SPECIFICATION & DISCOVERY PACK (v1.0)

```text
IES-020 D20 SPECIFICATION
STATUS: METHODOLOGY ACCEPTED (M1–M15 ACCEPTED; G1–G6 DECIDED — recorded 2026-08-20)

Certification data is FROZEN (see D20_CERTIFICATION_DATA_ACCEPTANCE.md).
No implementation authorization exists.
No repository implementation is authorized.
```

**Workstream:** IIPS v3.0 Engine Certification Program (IES-016 CLOSED; IES-017 PROMOTED at `d51b120`).
**Baseline anchor:** canonical `d51b120b2ac8a524bf088ed8fe80b904c29a628b`.
**Reference:** certified IES-015/016/017 engines — **structural/process precedent ONLY. No domain methodology is inherited.**
**Status:** PROPOSED — supersedes the IES-020 "AUTHORITY GAP" STOP state only once the maintainer accepts the D20 methodology via `D20_AUTHORITY_REVIEW.md`.

---

## 0. Document control

| Attribute | Value (PROPOSED) |
|---|---|
| Standard | IES-020 |
| Contract version | D20 v1.0 (normative) — PROPOSED |
| Engine ID | `sector.materials-metals` |
| SectorFamily | `Materials & Metals` |
| Engine version | `1.0.0` |
| Program | v3.0 Engine Certification Program |
| Roadmap authority | v1.0 §7.3/§8/§9; Amendment v1.1 §1/§B/§C/§D/§F |
| Data authority | **PENDING** — all fixtures PROPOSED synthetic (IES-015/016/017 convention) |

---

## 1. D20 scope and intended purpose

Materials & Metals is the third pending engine (Amendment v1.1 §C). It must deliver a deterministic sector engine following the 19-stage lifecycle (v1.0 §8), reproducing frozen expected outputs byte-identically, registering into the governed universe with **zero CSIP/platform/framework change**, and extending the governed API/admin/UI automatically.

---

## 2. Sector definition and boundaries (PROPOSED)

The sector covers **upstream mining & primary metal production** and **downstream materials processing/transformation**.

**Included (PROPOSED):** diversified multi-commodity miners; base-metals producers (copper, zinc, lead, nickel, aluminium, etc.); precious-metals producers (gold, silver, PGMs); iron-ore and steel producers (integrated BOF and EAF); aluminium and specialty-materials processors (advanced alloys, rare-earth processing, battery-materials, recycling).

**Excluded (PROPOSED):** pure commodity trading/merchant businesses; fabricated-end-product manufacturers (covered by Industrials); downstream chemical producers (Chemicals — historic, superseded); equipment OEMs.

**OPEN AUTHORITY QUESTION (Q1):** whether aluminium producers belong under `base-metals` (upstream) or `steel-producers` (smelting/metal-making) — proposal places primary aluminium under `base-metals` and rolled/extruded aluminium under `specialty-materials`.

---

## 3. Included / excluded Materials & Metals activities (PROPOSED)

| Activity | Disposition |
|---|---|
| Mine exploration/development/production | Included |
| Smelting/refining of base & precious metals | Included |
| Steelmaking (integrated + EAF) | Included |
| Advanced/specialty alloys & rare-earth processing | Included |
| Scrap-based recycling | Included |
| Royalty/streaming finance of mines | Included (archetype) |
| Commodity trading | Excluded |
| Fabricated end products | Excluded (Industrials) |

---

## 4. Proposed subsegment taxonomy (M4)

| Subsegment | Description |
|---|---|
| `diversified-miners` | Multi-commodity mining majors |
| `base-metals` | Copper/zinc/lead/nickel/aluminium producers |
| `precious-metals` | Gold/silver/PGM producers |
| `steel-producers` | Integrated BOF + EAF steelmakers |
| `specialty-materials` | Advanced alloys, rare-earths, battery-materials processors |

## 5. Proposed archetype taxonomy (M5)

`integrated` (mine-to-metal) · `pure-play` (single commodity) · `processor` (no mining) · `recycling` (scrap-based/circular) · `royalty` (royalty/streaming) · `hybrid`.

---

## 6–8. Proposed metric taxonomy (M1/M2/M3)

| Code | Field | Unit | Interpretation | Direction |
|---|---|---|---|---|
| MM-001 | `ebitdaMargin` | % | EBITDA margin | higher-better |
| MM-002 | `revenueGrowth` | % | Revenue growth (YoY) | higher-better |
| MM-003 | `debtEbitda` | × | Net debt / EBITDA | lower-better |
| MM-004 | `reserveLife` | years | Proven+probable reserves ÷ annual production | higher-better |
| MM-005 | `cashCostCurve` | % | Cost-curve percentile position | lower-better |
| MM-006 | `realizedPriceSpread` | % | Realized vs benchmark price | higher-better |
| MM-007 | `fcfYield` | % | Free cash flow yield | higher-better |
| MM-008 | `roic` | % | Return on invested capital | higher-better |
| MM-009 | `capexIntensity` | % | Capex / revenue | lower-better |
| MM-010 | `inventoryDays` | days | Inventory days on hand | lower-better |
| MM-011 | `evEbitda` | × | Enterprise value / EBITDA | lower-better |
| MM-012 | `recyclingInputMix` | % | Recycled/scrap input share | higher-better |

**Override flags (M13):** `governance`, `tailingsFailure`, `permittingRevocation`, `strikeDisruption`, `capexOverrun`, `marginCompression`, `competitionPressure`.

**OPEN AUTHORITY QUESTIONS:** Q2 — whether `cashCostCurve` percentile is an acceptable *input* primitive (it is a derived cost-curve statistic; alternative = absolute unit cash cost in USD/unit, which varies by commodity). Q3 — whether `reserveLife` should be commodity-weighted.

---

## 9–12. Proposed pillars (M6) and weights (M7)

| Pillar | Composition (weights renormalize over available metrics) |
|---|---|
| `quality` | MM-004 (0.35) + MM-005 (0.35) + MM-006 (0.30) |
| `growth` | MM-002 (0.50) + MM-012 (0.50) |
| `risk` | MM-003 (0.40) + MM-010 (0.35) + MM-009 (0.25) |
| `profitability` | MM-001 (0.55) + MM-008 (0.45) |
| `capitalEfficiency` | MM-007 (1.00) |
| `valuation` | MM-011 (1.00) |

**Subsegment 6-dim vectors (sum 1.0) + leverage alerts (M14):**

| Subsegment | w [quality, growth, risk, profitability, capEff, valuation] | leverageAlert |
|---|---|---|
| diversified-miners | [0.25, 0.20, 0.25, 0.15, 0.10, 0.05] | 3.0 |
| base-metals | [0.25, 0.20, 0.25, 0.15, 0.10, 0.05] | 3.5 |
| precious-metals | [0.30, 0.15, 0.20, 0.20, 0.10, 0.05] | 2.5 |
| steel-producers | [0.25, 0.15, 0.25, 0.20, 0.10, 0.05] | 3.0 |
| specialty-materials | [0.30, 0.20, 0.20, 0.15, 0.10, 0.05] | 3.0 |

**Archetype risk multipliers (M14):** `integrated` 1.0 · `pure-play` 1.1 · `processor` 0.9 · `recycling` 0.9 · `royalty` 0.8 · `hybrid` 1.0.

---

## 13–15. Scoring / normalization / missing-data (PROPOSED)

Mirrors the certified template: metric → band → score (lower-incl/upper-excl; terminal includes upper bound); **effective band-table resolution = calibrated ?? baseline with cardinality invariant (M10)**; pillars via weighted renormalization over available metrics (**M8**: missing primitive dropped; empty pillar → 0.0, never fabricated); **composite = round-half-to-even at 1 decimal, composite only (M11)**; **left-to-right summation (M15 — explicitly PROPOSED to avoid the compensated-summation defect corrected for IES-017)**.

Calibrated band tables (M9, PROPOSED): `precious-metals` MM-004 (longer reserve lives), `steel-producers` MM-005 (wider cost curve), `specialty-materials` MM-012 (lower recycling base).

---

## 16. Proposed confidence / evidence treatment (G-decision — see D20_AUTHORITY_REVIEW Part D)

Engine never fabricates confidence; golden expected outputs carry none → governed transport reports `null` → UI "unavailable". The internal `EvidencePipeline.build(confidence: number)` non-nullable contract requires an explicit **G-decision** (the IES-016/017 Option-A does **not** auto-transfer).

---

## 17–19. Verdict bands (M12) + overrides (M13) + leverage/risk (M14)

```text
80–100 Strong Buy · 70–80 Buy · 60–70 Accumulate · 50–60 Hold · 40–50 Watch · 0–40 Avoid
```

`finalVerdict = min_rank(baseVerdict, all applicable override caps)`.
Caps: `governance` → Avoid; `tailings-failure`, `permitting-revocation`, `strike-disruption`, `capex-overrun`, `margin-compression`, `competition-pressure`, `leverage-breach` → Watch.
`leverage-breach` auto-applies when `debtEbitda >= subsegment.leverageAlert`.

---

## 20–21. Rounding / summation / deterministic replay (M11/M15)

Round-half-to-even at 1 decimal (composite only); **left-to-right summation**; no random/clock; identical input → identical output/evidence/metadata.

---

## 22. Proposed synthetic/provider assumptions (ILLUSTRATIVE ONLY)

13 synthetic reference providers (MM-001…MM-013) + 2 edge cases (MM-014, MM-015) — the IES-015/016/017 frozen-Replay-Baseline convention. **NOT real companies.** Accepted under D20 M1–M15 (recorded 2026-08-20); frozen as certification data (see `D20_CERTIFICATION_DATA_ACCEPTANCE.md`).

---

## 23. Proposed ontology mapping

8-dimension registration (`sector.materials-metals` / `Materials & Metals`; Conviction/Confidence/Quality/Growth/Risk/Profitability/Capital Efficiency/Valuation). Zero CSIP change.

---

## 24. Proposed evidence contract implications

Evidence package per execution (engineId, recommendation, compositeScore, supporting scores quality/growth/risk/profitability, decisionRulesApplied, calibrationVersion, replayReference, provenance). Confidence: null-honest at the governed surface; internal non-null plumbing requires the G-decision.

---

## 25. Proposed API/transport implications (integration proposal only)

Both `ENGINE_FACTORY` registries + `SECTOR_DIR: 'Materials & Metals': 'materials-metals'` + replay-baseline 13th entry (append-only) + admin auto-registration 12→13 + generic `/api/company|evidence|replay/:sector` auto-extension + certification-suite 12→13 mechanical extension. **No changes are made in this proposal stage.**

---

## 26. Proposed acceptance criteria (future, after authority)

```text
[ ] Engine reproduces 13 frozen expected outputs byte-identically
[ ] Replay byte-identical; ties-to-even proven (MM-010: 63.25 -> 63.2)
[ ] Missing-primitive (MM-014) and calibrated-boundary (MM-015) proven
[ ] Both factories + SECTOR_DIR + replay-baseline 13th entry; admin 13/13; universe 13
[ ] Full platform regression (520 + new engine tests); frontend 326/21/347
[ ] typecheck ×2 + build exit 0; git diff --check clean; forbidden paths empty
[ ] Certification reports + README/ROADMAP reconciled; null-honest confidence
[ ] No commit/push until promotion authorization
```

---

## 27. Proposed certification-data requirements

After methodology authority: freeze the calibration, golden-reference, validation-fixtures, expected-outputs, replay-dataset, and ontology metadata with recorded SHA256; acceptance matrix + readiness certificate + risk register + release notes. All currently **PROPOSED/ILLUSTRATIVE — NOT FROZEN**.

---

## 28. Unresolved questions requiring authority decisions

| # | Question |
|---|---|
| Q1 | Aluminium placement (`base-metals` vs `specialty-materials`) |
| Q2 | `cashCostCurve` percentile as an input primitive vs absolute unit cash cost |
| Q3 | `reserveLife` commodity-weighting |
| Q4 | Confidence treatment (G-decision — Option-A analog or other) |
| Q5 | Whether `royalty`/`streaming` is a legitimate archetype or should be excluded |

---

**IES-020 D20 SPECIFICATION STATUS: METHODOLOGY ACCEPTED (M1–M15 + G1–G6, recorded 2026-08-20); CERTIFICATION DATA FROZEN**
**ENGINE IMPLEMENTATION: NOT AUTHORIZED**
