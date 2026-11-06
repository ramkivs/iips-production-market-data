# IIPS V3 — D05 Wave-3 Universe Expansion — 2026-11-06

**Governing authorization:** Program Authority task, 2026-11-06 — "Expand the restricted 2,250-record D05 Security Master to the intended broader, authoritative NSE equity security universe. This is the actual universe-expansion work that B-05 was intended to accomplish but did not achieve."
**Scope:** IPD only. Baseline `main@943309e4e84614bb8edc8d5631cd0292c7716807` (post-B-05-disposition merge). Not a re-open of the D05 restricted-universe investigation; Wave-1 `BATCH-D05-TIER2-BROAD-UNIVERSE-2026-09-22-001` (2,250 records, SHA-256 `7f53540b…74b5`) is the intentional-but-restricted baseline to expand from.

**Headline result (do not soften):** the authoritative acquisition did not complete. **Zero securities were incorporated; the corpus remains byte-identical at 2,250 records under the Wave-1 revision.** A zero-addition disposition revision was deliberately **not** published. What was independently executable in this sandbox — scope determination, the full acquisition/vetting machinery, targeted tests and this evidence — was completed. The exhaustive blocker statement and the operator action required to finish the expansion are in §6–§7.

## 1. Input evidence (read-only, immutable)

| Artifact | Reference |
|---|---|
| B-04 holdings (68 rows) | IRR `ramkivs/iips-review-recovered`, PR #496, merge `0a0aac2bba517be933dae7a91a89af2943996b51`; repo copy `evidence/operator_drop/wave2-2026-11-06/source.csv` (SHA-256 `2dc1d1fba6e183cfa657652d0dab98daac570df6e3ef3adbbc8f2a397fcabd0d`) |
| B-05 disposition (zero incorporation) | IPD `BATCH-D05-TIER2-BROAD-UNIVERSE-WAVE2-DISPOSITION-2026-11-06-001`; PR #133 → merge `943309e…` |
| B-06 reassessment (no new resolution) | IRR `…/2026-11-06` — `docs/integration/B06-DHAN-68-WAVE2-REASSESSMENT-2026-11-06.md`; aggregate 1 RESOLVED / 67 UNRESOLVED / 0 ambiguous |
| Governed corpus | `evidence/operator_drop/d05_security_master_broad_universe.json`, SHA-256 `7f53540b…74b5`, 2,250 records — untouched in this pass |
| Wave-3 machine-readable acquisition log | `evidence/operator_drop/wave3-2026-11-06/acquisition-attempt-log.json` (SHA-256 `93c92ec40bc8b3bc14cfc28fef7683653c02e01e51425adfcc111193bf51e290`) |

## 2. Expansion scope, as designed by the existing D05 design

- Design intent ("Tier 2 Active NSE CM"): the full population of **actively listed NSE CM equity instruments** (EQ series, ACTIVE status), not a portfolio-tagged subset. The `BLOCK-3L` audit explicitly called for "real mid-cap/small-cap equities … formally deposited and governed under a future authorized Security Master Expansion Act" naming e.g. `ASK AUTOMOTIVE`, `AMBUJACEM`, `HCLTECH`, `M&M`, `ZOMATO` — all absent from the 2,250-record corpus.
- The 2,250-record baseline comprises **52 real (50 Nifty + AIIL `EQ_AIIL_IN` + AGI `EQ_AGI_IN`) + 2,198 synthetic** (`IT0001`…`CON2198`) per BLOCK-3L §Master Composition. It is intentionally restricted; it is NOT the exhaustive Tier-2 CM equity universe.
- Wave-3 (this task) scope: **every eligible ACTIVE NSE CM equity** supported by authoritative full-record evidence — which, by construction, includes all 67 B-04 ISINs (each is an NSE CM equity by the user's supplied designation).
- Admission is determined record-by-record by the existing eligibility/provenance/uniqueness rules (§3), not by the border of this scope statement. Suspended/delisted securities are not admitted (Tier-2 CM = ACTIVE). Corporate action handling: a deposit must carry as-of-dated evidence per instrument (new symbol/ISIN post-action as a separate candidate row; historical rows retain their effective windows — never retroactively mutated). The gate implements this as record dispositioning, not rewriting.

## 3. Step 3 machinery built in this pass (independently executable; complete)

The reason B-05 could not incorporate anything was never an absence of intent — it was an absence of data. The same blockage, examined honestly this time, is addressed by building and testing the exact conformance machinery a Wave-3 deposit requires, so that when authorized bytes exist the expansion is one command plus one reviewed PR:

| Component | Location | Outcome |
|---|---|---|
| **Universe expansion gate** | `src/identity/universe_expansion_gate.ts` | Pure, deterministic (no clock/random/IO): tighter-than-contract admission pipeline reusing `validateInstrumentMaster` (d05_security_master contract), ISO 6166 + Luhn, uniqueness/conflict indexing against the prior corpus AND within the deposit (companyId, ISIN, listing symbols per exchange, BSE scrip codes, CIN), Tier-2 CM eligibility (ACTIVE + ≥1 ACTIVE NSE listing), effective-window sanity, missing-authoritative-field detection (faceValue/lotSize/tickSize/industry/sector/companyName/currency — **UNRESOLVED, never invented**), dispositions `ADDED / ALREADY_PRESENT / INELIGIBLE / UNRESOLVED` with per-row reasons, plus `scopeCoverage` (used for the 67). |
| **Acquisition/deposit CLI** | `scripts/wave3_universe_expansion.mjs` | Fail-closed: `--source-sha256` must equal candidate bytes; `--expected-prior-checksum` pins the Wave-1 corpus; zero-ADDED input ⇒ **exit 3, no deposition artifacts emitted by policy, vet report only**; never writes into `src/` or `evidence/`; emits merged corpus JSON + new manifest (`kind: EXPANSION_DEPOSITION`, prior-revision bindings) + runtime `d05_broad_universe_data.ts` + verification summary **into `--output-dir` only**. The repo deposit is a separate reviewed PR that also re-pins governed constants and test count pins. |
| **Targeted tests** | `tests/universe_expansion_gate.test.ts` | **16/16 (W3G-00…15)**: real corpus untouched by evaluation; candidate ADDED path; Luhn/shape refusal; missing listing evidence → UNRESOLVED; duplicate in deposit; ISIN/companyId/symbol/CIN conflicts vs corpus; ALREADY_PRESENT idempotence; SUSPENDED/DELISTED → INELIGIBLE; effective window; missing authoritative fields → UNRESOLVED; determinism; 67-scope coverage (0 present / 67 absent on unchanged corpus); merge materialization; contract binding; no evaluation-side writes. |

End-to-end dry-run performed (synthetic fixtures only; repo untouched): 3 eligible + 1 conflict + 1 missing-evidence candidate → ADDED 3 (merged 2,253, prior prefix value-identical, appended by companyId), conflicts resolved as designed; empty candidate set → exit 3 with report only; SHA mismatch → exit 2 refusal. Artifacts: `/tmp/wave3-out/` (not committed; CI-style check).

Quarter-truth on coverage: on the unchanged corpus the **67 B-04 ISINs are 0-present / 67-absent** (`EQ_AGI_IN` remains the only resolved holding, outside the 67). This is asserted by test W3G-12 and will be re-pinned in any real Wave-3 deposition.

## 4. Step 4 — Verification executed (2026-11-06, this pass)

| Step | Result |
|---|---|
| `npm ci` | 33 packages, exit 0 |
| `tsc --noEmit` | clean |
| `npm run build` (tsc + vite + packages) | exit 0 |
| New suite | 16/16 pass |
| Full guarded suite (`npm test`) | **1108 executed — 1107 passed — 0 failed — 1 pre-existing platform skip** (files=81) |
| Corpus byte-identity vs Wave-1 pin | `7f53540b…74b5` ✓ (checked at gate test + CLI prior-binding + manifest read-back) |
| Prior manifest intact | batchId/checksum/recordCount/authorizationRef ✓ (tests unchanged) |
| Gate determinism | identical inputs ⇒ deep-equal reports (W3G-12) |
| Scope coverage measured | 0/67 present on unchanged corpus (W3G-12) |

## 5. Step 5 — Publication

Committed to `arena/8d4ad851-iips-production-market-data`; one IPD PR against `main`; head CI required green before merge; merged-main CI and clean-clone verification recorded in the PR/final receipt. **No operational DB, provisioning, or activation anywhere. No existing corpus pin, manifest, runtime asset, Wave-1/Wave-2 revision, reconciliation v1/v2 or W-1 change.** Receipt rule maintained: no post-merge facts are claimed in this document.

## 6. EXACT BLOCKER (the one thing in this task that did not complete)

**Acquisition of the authoritative evidence could not be performed in this sandbox, and no authenticable copy of the full record set exists anywhere reachable from it.** Concretely, evidence-backed by `acquisition-attempt-log.json`:

1. The designated authoritative sources — NSE archives (`nsearchives.nseindia.com`: EQUITY_L / CM-UDiFF bhavcopy listings) and MCA master data (CIN, face value) — are **not reachable**: the only permitted egress hosts are `github.com`, `codeload.github.com`, `api.github.com`, `registry.npmjs.org`, `pypi.org`, `files.pythonhosted.org`.
2. `github.com/nseindia` and `github.com/bseindia` exist with **0 public repositories** — no official exchange data on GitHub.
3. GitHub code search (`filename:EQUITY_L.csv`) returns **218 hits, all third-party mirrors** — bytes unauthenticatable against NSE, freshness unverifiable, materially stale in samples. Declined.
4. npm/PyPI are reachable but contain only **live-fetch client libraries** (2026-11-06 result set; `jugaad-data`/`nsepython`/`nsetools`/`nse` ≤ 55 KB wheels; no bundled listing snapshot; live fetch targets unreachable).
5. The in-repo D114 archive records sha256-pinned NSE CM-UDiFF bhavcopies for 2024–2026 (~2,982–3,484 instruments/trading day) — **as manifests only; the bhavcopy CSVs were never deposited in this repository**, so no listing bytes are held.
6. The Wave-2 holdings source remains name+ISIN fields only.
7. **Structural gap (independent of networks):** even a reachable EQUITY_L cannot populate CIN, face value, industry/sector, lot/tick, or listing-status evidence — the contract requires them and the existing deposition process is an **operator-deposited governed dataset** (as used by Wave-1). No such Wave-3 deposition was supplied or found.

Consequences: **no record was incorporated; no breadth claim is made; the "subsequent dependency" (reassess the 68 Dhan holdings against the expanded corpus) is NOT satisfiable yet and was NOT re-run** (a re-run against the unchanged corpus would be the forbidden B-06 repeat).

## 7. What completes the expansion (operator action; the only remaining step)

One governed deposit, exactly the way Wave-1 was deposited, plus this PR's machinery:

1. Obtain (or compile from authorized market-data access) the authoritative merged record set for all ACTIVE NSE CM equities: exchange listing file (ISIN/symbol/name/series/listing date) + MCA CIN & face value + series/F&O lot/tick + industry/sector taxonomy deposition + ACTIVE/suspension evidence as of a named asOf date.
2. File it as `evidence/operator_drop/wave3-<date>/candidates.json` under a dedicated act (e.g. `AUTH-D05-WAVE3-UNIVERSE-EXPANSION-…`), recording source files, their sha256s and the asOf date; commit it in its own PR.
3. Run `node scripts/wave3_universe_expansion.mjs --candidate … --act … --source-sha256 … --source-description … --batch-id BATCH-D05-TIER2-BROAD-UNIVERSE-WAVE3-<date>-001 --output-dir …`.
4. Land the emitted merged corpus, runtime TS asset, new manifest **and the re-pinned governed constants** (`D05_BROAD_UNIVERSE_SOURCE_REVISION`, fixture counts, hydration/qualification/e2e pins, new checksum/count) in a single deposition PR; update the disposition/evidence pins; run the full suite; merge when green.
5. Then (and only then) reassess all 68 Dhan holdings against the **new** revision — expected: the 67 wave-2 ISINs become resolvable pending their own contract check; AGI remains `EQ_AGI_IN`.

## 8. Explicitly NOT done / NOT claimed

No broad-universe completion claim; no REAL/origin classification of any record; no fabricated symbol/CIN/face/lot/tick/sector; no new batchId minted for a zero-addition revision; no weakening of any eligibility/uniqueness/provenance rule; no change to reconciliation v1/v2, W-1, B-01/B-02/B-04, Wave-1/Wave-2 revisions, or any pinned test; no IRR writes; no operational DB/provisioning/activation; no claim that this is production readiness or Gate 4/5/QE passage.
