# GATE C — B1 THREE-ENGINE CERTIFICATION DETERMINATION

| Field | Value |
|---|---|
| Certification ID | `B1-CERT-IES016-IES017-IES020-2026-09-25-001` |
| Decision ID | `b1-three-engine-certification-2026-09-25-001` |
| Parent authority | RAMKI — `b1-three-engine-a1-adoption-2026-09-25-001` (Phase 2.5 act `0e032c5`); Gate C authorized 2026-09-25 |
| Repository / branch | `ramkivs/iips-production-market-data` @ `arena/01a0d33d-iips-production-market-data` |
| **B1 baseline** | `c6794de3d529e00647620dbcc6b00ba6a2dd46d3` (Gate B) |
| Gate A lineage | Gate A `0fd185940b328d8c1977d9ad838ee47e3a1f5624`; supplement amendment `edf9a93`; supplement execution `8b45d9ff6d4e8b3ee7b9db4ce538a35d44ec71ea` |
| Gate B lineage | `c6794de3d529e00647620dbcc6b00ba6a2dd46d3`: registry 10 → 13 (`GATE-B-THREE-ENGINE-REGISTRY-ADOPTION-PROVENANCE.md`) |
| Scope (exactly) | IES-016 `sector.telecommunications` · IES-017 `sector.automobile` · IES-020 `sector.materials-metals` |
| Not in scope | IES-006…015 are **not** re-certified. No other engine is certified by this gate |
| Evidence bundle | `GATE-C-B1-THREE-ENGINE-CERTIFICATION-EVIDENCE.json` (every file with Git blob + SHA-256, all 36 pins, every test name and result) |
| **Determination** | **B1 CERTIFICATION = CONDITIONAL / QUALIFIED** (see §8) |

**Evidence environment:** Arena sandbox, Linux 6.1 x86_64, Node v22.22.3, tsx v4.23.9, fresh
`npm ci` (root + `iips-platform`), all runs at baseline `c6794de`. Windows was **not** observed by
this gate.

---

## 1. Pre-certification invariants (all PASS)

| # | Invariant | Result |
|---|---|---|
| 1 | B1 HEAD == `c6794de` | PASS* |
| 2 | LOCAL == REMOTE | PASS (`ls-remote` = `c6794de`) |
| 3 | Worktree clean | PASS (0 lines) |
| 4 | Gate A supplement present | PASS (`8b45d9f` is the ancestor; execution addendum present) |
| 5 | Gate B adoption record present | PASS |
| 6 | Registry contains exactly 13 engines | PASS (ER-02) |
| 7 | IES-016/017/020 resolve | PASS (ER-10, ER-11) |
| 8 | Pack trees `33e4f3ac…` / `a2de07ff…` / `2b66ff12…` | PASS (34 files each, zero worktree diff) |
| 9 | 36/36 manifest hashes | PASS |
| 10 | WP4 15/15 | PASS |
| 11 | Historical A1 / `phase13-next` unchanged | PASS (`phase13-next` = `1a602d849cc4…`; `c2dda91` is its ancestor) |
| 12 | D7 and GovTip unchanged | PASS (GovTip irr `arena/01a03e3b` = `524739093adb…`; no D7 path changed since `0e032c5`) |
| 13 | No B1 certification exists | PASS (no prior Gate C or certification record; API and registry disclose `NONE CLAIMED` / "pending certification") |

\* **Process disclosure:** the sandbox had been restored to a stale local ref (`da43051`). Before
any action, the worktree was proven byte-identical to `c6794de` through a temporary index (0
modified, 0 untracked). The local branch ref was then re-pointed to `c6794de`. This was local
only: no reset, rebase, amend or force-push.

## 2. Evidence inventory (B1-native, baseline `c6794de`)

Full hashes are in the JSON bundle; abbreviated here.

### A–B. Engine identity and engine-source identity

| IES | engineId (= module constant) | Engine source tree (B1) | Files | Registry entry |
|---|---|---|---|---|
| IES-016 | `sector.telecommunications` | `iips-platform/src/sector-engines/telecommunications/` `ff92542423f5751c992dc31961aedc9810651291` | 11 | `EngineRegistry.ts` blob `df1c2d3f0879…` |
| IES-017 | `sector.automobile` | `iips-platform/src/sector-engines/automobile/` `dbdaa90e224b9297a330856f46abb6787790bdf7` | 11 | ″ |
| IES-020 | `sector.materials-metals` | `iips-platform/src/sector-engines/materials-metals/` `e3e13d5fc55e12947b27a2a50fe6f5baab994537` | 11 | ″ |

- **Identity checks:** engine-module ID constant = registry entry = freeze-manifest `standard` = ontology-metadata `engineId`/`standard`/`sectorFamily` (tests ER-10 and ER-11 PASS).
- **Engine source provenance:** unchanged in B1 since `ea70a8c`.

### C–D. Canonical pack identity and freeze-manifest integrity

| IES | Pack | Tree | Files | Manifest pins |
|---|---|---|---|---|
| IES-016 | `ies-016-telecommunications/` | `33e4f3ac97428da6d257b7a308c9c56256350997` | 34 | 12/12 |
| IES-017 | `ies-017-automobile/` | `a2de07ffeb9ddfd2eac84221f0a1a6fef42a88d9` | 34 | 12/12 |
| IES-020 | `ies-020-materials-metals/` | `2b66ff12d81288d5ba0d25b2a4bcd166a178b58d` | 34 | 12/12 |

**36/36 pins match.** How they match:
- 30 match the CRLF rendering of the LF-committed blob. These are the data assets; this is the known manifest convention (pins computed on a CRLF checkout).
- 6 match the raw committed bytes: `architectureReview` and `authorityReview` ×3.
- Every pin maps to exactly one pack file.

### E–I. Calibration, golden reference, validation fixtures, expected outputs, replay dataset

| Item | IES | Pack file | Git blob | SHA-256 (committed) | Manifest pin (rendering) |
|---|---|---|---|---|---|
| E | 016 | `calibration/telecommunications-calibration-1.0.0.json` | `178160fcbe0a` | `45068525bc6bb05b…` | `2d22256e2c13b0e5…` (crlf) |
| F | 016 | `fixtures/telecommunications-golden-reference-1.0.0.json` | `f0dfc647b8e0` | `b31f91c2ff765466…` | `feb521c8cdd55f5e…` (crlf) |
| G | 016 | `fixtures/telecommunications-validation-fixtures-1.0.0.json` | `25accdd952a6` | `acd54d85a203bdf0…` | `783d68ebc9d31188…` (crlf) |
| H | 016 | `expected-outputs/telecommunications-expected-outputs-1.0.0.json` | `0d45ffc44df6` | `3cfb9d93f545d45d…` | `18341d76da1c7577…` (crlf) |
| I | 016 | `replay-datasets/telecommunications-replay-dataset-1.0.0.json` | `ed6bbeb8b127` | `22261acd32cb9efd…` | `097ca980c103a19b…` (crlf) |
| E | 017 | `calibration/automobile-calibration-1.0.0.json` | `e3f84ede6f5e` | `02913ff64ecd407e…` | `64c8186debd575f6…` (crlf) |
| F | 017 | `fixtures/automobile-golden-reference-1.0.0.json` | `11dcd3953046` | `e3b97d77ac0fd33e…` | `d912224225c9364e…` (crlf) |
| G | 017 | `fixtures/automobile-validation-fixtures-1.0.0.json` | `fa9bb6df3560` | `9b637586e3d09f99…` | `e5a3cb5267666bf5…` (crlf) |
| H | 017 | `expected-outputs/automobile-expected-outputs-1.0.0.json` | `b9982d744d92` | `ea22807925694aa3…` | `ae532792a759b56b…` (crlf) |
| I | 017 | `replay-datasets/automobile-replay-dataset-1.0.0.json` | `f4d599631ee2` | `c8ed26c58dc6d2f7…` | `fce68b0af3ef09ab…` (crlf) |
| E | 020 | `calibration/materials-metals-calibration-1.0.0.json` | `ceea1d5fe7c9` | `548154315772f9bc…` | `bb0afb700d31b272…` (crlf) |
| F | 020 | `fixtures/materials-metals-golden-reference-1.0.0.json` | `1b601093cb09` | `5eafada968dd2cfe…` | `ec289d7701f3723e…` (crlf) |
| G | 020 | `fixtures/materials-metals-validation-fixtures-1.0.0.json` | `000412669a40` | `72339b609fb441bc…` | `d090b1b2e0959444…` (crlf) |
| H | 020 | `expected-outputs/materials-metals-expected-outputs-1.0.0.json` | `3e67cb6f01fd` | `56a6ad197640c9c9…` | `1f1414dfe313fdcc…` (crlf) |
| I | 020 | `replay-datasets/materials-metals-replay-dataset-1.0.0.json` | `62ace6612c28` | `6dbc399e8de92d0a…` | `b8c8409d06c81790…` (crlf) |

**Runtime binding (closes the chain from pinned asset to executing code):**
- Each engine's calibration loader does `import calibrationProfile from '../<engine>-calibration-1.0.0.json'`.
- The engine-local calibration, golden-reference, validation-fixture and expected-output files are all **Git-blob-identical** to the manifest-pinned pack files: 4/4 per engine, 12/12 total.
- The acceptance suites read the engine-local copies; the WP4 suites read the repo-root packs. Both therefore exercise the same pinned bytes.

### J–K. Registry and B1 provenance identity

- **Registry:** `EngineRegistry.ts` blob `df1c2d3f0879327c24dcde67018964bc2667b13a` and `EngineApiAdapter.ts` blob `1e9d649ca020b059a94a70acffaac641b8eda4c6`.
- **Engine count:** exactly 13. IES-006…015 are unchanged: reversing exactly the Gate B hunks reproduces the donor blobs `23f3622f…` / `16cf2aeb…` (ER-08).
- **B1 provenance chain:** authority act `0e032c5` → Gate A `0fd1859` (pack recovery) → supplement `8b45d9f` (pack-path completion) → Gate B `c6794de` (registry adoption) → this record.

### L. WP4 validation — 15/15 PASS

| IES | Tests (file `iips-platform/tests/regression/<engine>-wp4-validation.test.ts`) | Result |
|---|---|---|
| 016 | IES016-WP4-ACC1 golden regression (13 frozen expected outputs, from the standards unit) · ACC2 replay byte-identical · ACC3 validation fixtures · ACC4 replay-dataset integrity · ACC5 calibration integrity | 5/5 PASS |
| 017 | IES017-WP4-ACC1…ACC5 (same criteria) | 5/5 PASS |
| 020 | IES020-WP4-ACC1…ACC5 (same criteria) | 5/5 PASS |

### M. Regression coverage — all PASS, 0 skipped

| Suite (B1 `iips-platform/tests/regression/`) | IES-016 | IES-017 | IES-020 |
|---|---|---|---|
| `<engine>-acceptance.test.ts` (D16/D17/D20-ACC1…13) | 13/13 | 13/13 | 13/13 |
| `<engine>-framework-integration.test.ts` (FI-ACC1…7) | 7/7 | 7/7 | 7/7 |
| `<engine>-reuse-verification.test.ts` (RV-ACC1…4) | 4/4 | 4/4 | 4/4 |
| `<engine>-wp4-validation.test.ts` (WP4-ACC1…5) | 5/5 | 5/5 | 5/5 |
| **Per engine** | **29/29** | **29/29** | **29/29** |

- **Program v1.1 replay baseline:** `program-v1.1-certification/PROGRAM_v1.1_REPLAY_BASELINE.json` (blob `63bcd350f2cd…`, unmodified) contains `sectors[10..12]` for the three engines.
- **`program-v1.1-track3-replay-certification.test.ts`: 11/11 PASS.** T3-CERT-01 iterates all 13 baseline sectors and asserts that composite and verdict reproduce. Replay is byte-identical, fresh-process, calibration-bound and contract-bound.
- The T3-CERT-01 title still says "10-sector". The title is stale, not the behavior; recorded, not changed.
- This is the Program v1.1 "Track-3 replay" suite. It is **not** the D7 Tier-3 execution (see §6).
- **Root suite:** `node --test dist/tests/*.test.js` → **771/771 PASS**, including Engine Registry wiring ER-01…ER-12, 12/12.
- **Whole-tree `iips-platform`:** 560/606. All 46 failures are **pre-existing and unrelated**: ENOENT for absent IES-010…015 and `iips-cross-sector` packs. The failure set was identical at `8b45d9f` in Gate B, and **none** references IES-016/017/020.

### N. Windows/browser qualification

- The operator attests **Windows Gate-B qualification = PASS** in the Gate C authorization of 2026-09-25.
- This gate **did not observe** Windows or a browser. **No Windows/browser artifact is committed in B1** (no log, screenshot, command transcript or SHA).
- It is recorded as operator attestation only (see §7, L-2).

### O. API certification disclosure (before this determination)

Live HTTP probe against `createResearchSectorServer` (build of `c6794de`):

| Check | Result |
|---|---|
| `GET /api/engines` | HTTP **200**, **13** engines, IDs in registry order |
| `X-IIPS-Certification` | **`NONE CLAIMED`** |
| `provenance.b1Certification` | **`NONE CLAIMED`** |
| `certifiedCount` | 13 (registered-engine count, not certification) |
| IES-016/017/020 `certificationLineage` | `historical A1 lineage / B1 adoption pending certification` |
| IES-006…015 `certificationLineage` | `Program v1.1 LTS` |

The API disclosure is **not changed** by this gate: altering the registry and tests is prohibited.
The served payload therefore continues to claim no certification.

### P. No Execute capability

- The three engines have **no `ENGINE_FACTORY` entry**, so `makeCertifiedEngine()` fails closed with `factory-missing` (ER-12).
- `POST /api/engines/<id>/execute` returns **405** and `GET` returns **404** for all three (live probe; ER-03, ER-12).
- EXECUTION CODE PRESENT IN RECOVERED DONOR — NOT EXPOSED / NOT ROUTED / NOT CALLED / NOT AUTHORIZED.

## 3. Historical A1 lineage (reference only; NOT B1 certification)

- **Items that remain historical evidence only:** the `phase13-next` A1 certificates `IES-016-A1-2026-09-05`, `IES-017-A1-2026-09-05` and `IES-020-A1-2026-09-05`; the IVM A/A1 rows (`docs/v3.0/INTEGRATION_VERIFICATION_MATRIX.md` on irr); historical Gate-1 `b711e4c` and Gate-2 `e41b69c`; the historical composite closure; and the historical Tier-3 87/87.
- They are **not** represented as B1 certification, and **none was copied into B1**.
- **Lineage cross-check (content identity, read-only mirror):** the B1 engine-source trees and the three B1 pack trees are **tree-equal** to irr `c2dda91` (the A1-certified snapshot, an ancestor of `phase13-next`). This shows B1 runs the same code and assets that A1 evaluated. It is provenance, not certification: B1 and `c2dda91` share no merge base.
- The B1 readiness certificates (`iips-platform/IES016/017/020_FINAL_READINESS_CERTIFICATE.md`, blobs `8e20853c…` / `2abd3c7a…` / `2a45157b…`) remain historical-only (RAMKI Decision 2) and unmodified.

**The determination in §8 rests only on the B1 evidence in §2.**

## 4. Test results summary

| Area | Result |
|---|---|
| IES-016 / 017 / 020 regression | 29/29 · 29/29 · 29/29 (87/87 in total, B1 Linux regression, **not** Tier-3) |
| WP4 | 15/15 |
| Track-3 replay (Program v1.1 baseline, 13 sectors) | 11/11 |
| Engine Registry wiring | 12/12 |
| Root suite | 771/771 |
| Pack integrity | 34/34 × 3 |
| Manifest integrity | 36/36 |
| API | 200 / 13 / NONE CLAIMED ×2 / execute 405+404 |

## 5. Windows and API qualification

- **Windows/browser:** PASS by operator attestation (Gate B), not observed, not committed as an artifact.
- **API:** qualified as read-only, 13 engines, certification claimed by neither header nor payload, execution not exposed.

## 6. Tier-3 limitation (explicit)

- **The historical 87/87** and the Gate A supplement 87/87 reproduction are **not** "Tier-3 certified". The earlier B1 run was reproduction evidence only, in a different environment, OS, filesystem path and dependency installation.
- **This gate's 87/87** (29 × 3 regression tests above) is **B1 Linux regression evidence**. It is not the authoritative Windows Tier-3 execution.
- **Cannot be reproduced here:** the authoritative Tier-3 execution requires its original Windows environment, and the D7 P1 script (`D7-TIER3-PARITY-P1-EXECUTION-Gate-v3.ps1`) is absent and must not be re-run. It is **not reproduced and not substituted**.

## 7. Known limitations (all carried into the determination)

| ID | Limitation | Effect |
|---|---|---|
| L-1 | Authoritative Windows Tier-3 execution not reproduced under its required environment (§6) | Certification criterion not established on B1 evidence |
| L-2 | Windows/browser qualification is operator-attested; no B1 artifact; not observed by this gate | Evidence item N is attestation, not recorded evidence |
| L-3 | **Certifier independence:** this determination was prepared by the same agent that executed Gates A and B, in a single environment. It is not an independent adjudication | Independence not established |
| L-4 | IES-017 recovered ontology metadata labels its contract "IES-017 v1.0 (D17 normative) — PROPOSED, NOT AUTHORITY". IES-017 stale pack OPEN/NON-BLOCKING; the 74.9 / 71.9 values are preserved | IES-017 contract authority status unresolved |
| L-5 | **D7 qualifications, carried forward unchanged.** Parity SATISFIED WITH QUALIFICATIONS. Independence OPEN/NEGATIVE; adjudication report `2296764a…` unrecoverable; Q5 OUTSIDE; DF-1; 33/33; IES-020 §28; adjudicator non-independence. The D7 pathway remains CLOSED | Qualifications attach to any determination |
| L-6 | Manifest pins match 30/36 via CRLF rendering of LF-committed blobs (6/36 raw). Integrity is established by rendering equivalence for the data assets | Disclosed, not a failure |
| L-7 | API and registry still disclose `NONE CLAIMED` / "pending certification". Reflecting this determination in the served disclosure requires a separately authorized gate, because registry, tests and header are out of scope | Disclosure intentionally lags; no over-claim |
| L-8 | 46 pre-existing whole-tree `iips-platform` failures (absent IES-010…015 and cross-sector packs); unrelated to the three engines | None for scope |
| L-9 | T3-CERT-01 title says "10-sector" while it iterates 13 | Cosmetic; not changed (tests frozen) |

## 8. Certification determination

**B1 CERTIFICATION = CONDITIONAL / QUALIFIED**, for IES-016 `sector.telecommunications`,
IES-017 `sector.automobile` and IES-020 `sector.materials-metals` at B1 baseline `c6794de`.

**Basis:**
- Every B1-executable criterion (A–M, O, P) is established on B1 evidence with **zero failures**:
  - identity;
  - source, pack, manifest, calibration, golden, fixture, expected-output and replay identity;
  - the runtime binding of those assets to the executing code;
  - registry;
  - WP4 15/15;
  - regression 87/87;
  - replay-baseline reproduction for all three engines;
  - API disclosure;
  - no Execute.
- **Why not CERTIFIED:** it fails closed on the criteria that cannot be established on B1 evidence here: L-1 (authoritative Tier-3), L-2 (Windows/browser qualification not evidenced in B1), L-3 (independence), L-4 (IES-017 contract status) and L-5 (D7 qualifications).
- **Why not NOT CERTIFIED:** no executed criterion failed.

**What would lift the qualification** (each requires RAMKI authorization; none is performed or implied here):
1. authoritative Tier-3 execution in its required environment, or an explicit RAMKI acceptance of the B1 reproduction as its substitute;
2. a committed Windows/browser qualification artifact;
3. independent adjudication;
4. resolution of the IES-017 D17 contract authority status;
5. RAMKI disposition of the D7 qualifications.

A separate gate would then be needed to update the served certification disclosure.

**This determination grants nothing else.** It is not a production entitlement, release, promotion, tag or merge. It does not enable Execute. It does not alter D7, D115, GovTip, `phase13-next`, NSE/Dhan state or any historical authority record. It transfers no A1 certification.

## 9. Files created by Gate C

- `evidence/target-shell-integration/GATE-C-B1-THREE-ENGINE-CERTIFICATION-DETERMINATION.md` (this record)
- `evidence/target-shell-integration/GATE-C-B1-THREE-ENGINE-CERTIFICATION-EVIDENCE.json` (evidence inventory)

No other file was modified: no registry, engine source, packs, manifests, tests, replay baseline or authority records.
