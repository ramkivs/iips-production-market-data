# GATE B — B1 THREE-ENGINE IMPLEMENTATION / REGISTRY ADOPTION — PROVENANCE RECORD

| Field | Value |
|---|---|
| Decision ID | `b1-three-engine-a1-adoption-2026-09-25-001` |
| Authority | RAMKI — `B1-THREE-ENGINE-A1-ADOPTION-AUTHORITY-RECORD.md` (Phase 2.5 act `0e032c5`), Decisions 1–5 |
| Gate | GATE B — B1 three-engine implementation / registry adoption |
| Repository / branch | `ramkivs/iips-production-market-data` @ `arena/01a0d33d-iips-production-market-data` |
| Baseline (parent) | `8b45d9ff6d4e8b3ee7b9db4ce538a35d44ec71ea` (Gate A supplement execution) |
| Engines adopted | IES-016 `sector.telecommunications`, IES-017 `sector.automobile`, IES-020 `sector.materials-metals` |
| Registry | exactly **10 → 13** registered engines |
| Certification | **NONE CLAIMED.** B1 certification of IES-016/017/020 is **NOT YET PERFORMED — pending Gate C** |
| Date | 2026-09-25 |

---

## 1. What Gate B did (and only this)

The three engines were **registered** in the B1 Engine Registry
(`iips-platform/src/integration/EngineRegistry.ts`) using the **existing B1 engine sources**
(`iips-platform/src/sector-engines/{telecommunications,automobile,materials-metals}/`). No engine
code was changed and no engine source was copied from `phase13-next`. Each new entry's `engineId`
is the ID constant **imported from the existing B1 engine module** (`TELECOMMUNICATIONS_ENGINE_ID`,
`AUTOMOBILE_ENGINE_ID`, `MATERIALS_METALS_ENGINE_ID`), and it is proven equal to the freeze manifest
and the recovered ontology metadata in the Gate A packs (tests ER-10 and ER-11).

The 10 existing entries (IES-006…015) are **byte-unchanged and keep their order**. The three
new entries are appended after IES-015.

| # | engineId | IES | iesTitle | sectorFamily | calibrationProfile | contractVersion | freezeManifest | readinessCertificate (historical) |
|---|---|---|---|---|---|---|---|---|
| 11 | `sector.telecommunications` | IES-016 | Telecommunications Sector Engine | Telecommunications | `telecommunications-calibration-1.0.0` | IES-016 v1.0 (D16) | `ies-016-telecommunications/IES-016_FREEZE_MANIFEST.json` | `iips-platform/IES016_FINAL_READINESS_CERTIFICATE.md` |
| 12 | `sector.automobile` | IES-017 | Automobile Sector Engine | Automobile | `automobile-calibration-1.0.0` | IES-017 v1.0 (D17) | `ies-017-automobile/IES-017_FREEZE_MANIFEST.json` | `iips-platform/IES017_FINAL_READINESS_CERTIFICATE.md` |
| 13 | `sector.materials-metals` | IES-020 | Materials & Metals Sector Engine | Materials & Metals | `materials-metals-calibration-1.0.0` | IES-020 v1.0 (D20) | `ies-020-materials-metals/IES-020_FREEZE_MANIFEST.json` | `iips-platform/IES020_FINAL_READINESS_CERTIFICATE.md` |

All three entries also share these values: `engineVersion 1.0.0`, `secVersion 1.0`,
`semcVersion 1.0`, `calibrationVersion 1.0.0`, capabilities
`metrics, scoring, calibration, decision, evidence, ontology`, and `ontologyDimensions 8`.

**Value sources (none invented):**
- `iesTitle`, `calibrationProfile`, `standard` and methodology come from the freeze manifests.
- sec/semc versions and the ontology come from the engine sources.
- The 8 ontology dimensions come from the recovered `*-ontology-metadata-1.0.0.json` files.
- `contractVersion` comes from the replay-baseline and manifest `IES-0xx v1.0 (D1x/D20 normative)` wording, in the existing registry pattern.
- Per RAMKI Decision 2, the readiness certificates are referenced as **historical only** and are unmodified.

## 2. Certification-lineage distinction (RAMKI Decision 5)

| Engines | Lineage (served per engine as `certificationLineage`) |
|---|---|
| IES-006…015 (10) | `Program v1.1 LTS` |
| IES-016 / IES-017 / IES-020 (3) | `historical A1 lineage / B1 adoption pending certification` |

- **Historical A1 lineage** stays anchored to `ramkivs/iips-review-recovered` `phase13-next`
  (`1a602d849cc4…`, unchanged). It was **not rewritten and not transferred**.
- **Adoption does not transfer certification.** No A1 certificate or IVM was copied into B1, no
  A1-equivalent certificate was created, and no B1 certification is claimed.
- **B1 certification of the three engines is pending Gate C** (NOT YET PERFORMED).
- `X-IIPS-Certification: NONE CLAIMED` (`frontend/server/research-sector-transport.ts`) is
  **unchanged**. The served payload also carries `provenance.b1Certification: 'NONE CLAIMED'`.
- `provenance.certifiedCount` is kept (Decision 5) and now equals the registry length, **13**. It
  counts registered engines, not B1 certifications. The served `provenance.source` states:
  `… ; Gate B — IES-016/017/020 historical A1 lineage / B1 adoption pending certification (NOT B1-certified)`.
  The unchanged Engine Registry component renders this string.
- `getCertificationLineage()` **fails closed** (throws `unregistered-engine`) for any unregistered ID.
- B1 does **not** inherit E2E-030 (10-engine LTS scope). That wording stays in place as historical.

## 3. Execution boundary (unchanged)

**EXECUTION CODE PRESENT IN RECOVERED DONOR — NOT EXPOSED / NOT ROUTED / NOT CALLED / NOT AUTHORIZED.**

- The three engines were deliberately **NOT** added to `ENGINE_FACTORY` in `EngineApiAdapter.ts`,
  because that is the execute materialization path, which is not authorized.
- `makeCertifiedEngine()` for these three IDs therefore fails closed with `factory-missing`.
- `POST /api/engines/:id/execute` is still 405 and `GET` returns 404, for all 13 engines.
  Covered by tests ER-03, ER-04 and ER-12.

## 4. Exact files modified (the authorized scope)

| # | File | Scope item | Change |
|---|---|---|---|
| 1 | `iips-platform/src/integration/EngineRegistry.ts` | registry | header text; 3 imports; array doc comment; 3 appended entries; `CertificationLineage`, `B1_ADOPTION_PENDING_CERTIFICATION`, `getCertificationLineage` |
| 2 | `iips-platform/src/integration/EngineApiAdapter.ts` | bounded provenance change | lineage import; `certificationLineage` per engine; `provenance.b1Certification`; `source` qualification. `ENGINE_FACTORY` / `execute()` unchanged |
| 3 | `tests/engine_registry_wiring.test.ts` | registry/adoption test | 10 → 13 expectations; forbidden-ID protection removed **only** for the 3 adopted IDs (the D42 IDs stay forbidden); lineage assertions; ER-08 re-pin (Decision 3); new ER-10…ER-12 |
| 4 | `tests/engine_registry_gate2_baseline.ts` | Decision 4 baseline re-pin | `GATEB_COMMENT_UPDATES` + `preGateB`. `GATE2_ADDITIONS` kept verbatim; the 6 dependent suites keep their original SHA-256 pins |
| 5 | `frontend/server/research-sector-transport.ts` | stale comment | line 74 |
| 6 | `frontend/src/app/App.tsx` | stale comment | line 130 |
| 7 | `frontend/src/app/navigation.ts` | stale comment | lines 131–132 (one comment). "certified" was dropped so that 13 engines are not implied to be certified |
| 8 | `frontend/src/app/routes.ts` | stale comment | line 45 (comment only; route map unchanged) |
| 9 | `evidence/target-shell-integration/GATE-B-THREE-ENGINE-REGISTRY-ADOPTION-PROVENANCE.md` | new record | this file |

Each comment now reads "13 registered engines after Gate B adoption" and implies no B1
certification. The historical text ("E2E-030 10-ENGINE LTS scope", "B1 does not inherit E2E-030")
is kept.

**Frontend client and component:** `frontend/src/api/engines.ts` (`27a5bb3b…`) and
`frontend/src/features/engines/EngineRegistry.tsx` (`77a09ed4…`) are **unchanged** and their pins
still hold.

## 5. Pin changes (RAMKI Decisions 3 and 4)

| File | Pre-Gate-B blob (donor 286f3da) | Gate B blob | Continuing assertion |
|---|---|---|---|
| `EngineRegistry.ts` | `23f3622f381bef2d0b19a6eea69386bf6feccecd` | `df1c2d3f0879327c24dcde67018964bc2667b13a` | reversing exactly the 6 Gate B hunks reproduces `23f3622f…` byte-for-byte (so the existing 10 entries are unchanged) |
| `EngineApiAdapter.ts` | `16cf2aebeac80bc874c67dd892ba98c9baffdbbe` | `1e9d649ca020b059a94a70acffaac641b8eda4c6` | reversing exactly the 5 Gate B hunks reproduces `16cf2aeb…` byte-for-byte (so `ENGINE_FACTORY` and `execute()` are unchanged) |

- The donor pins are therefore **still asserted**, against the file with the Gate B change reversed. They were not deleted.
- Negative controls were run and restored. A one-character change to the existing IES-006 entry failed ER-08. A stray extra word in the `routes.ts` comment made `preGate2` throw in the dependent suites.

## 6. Validation (Arena sandbox, Linux; Windows/browser NOT observed)

| Check | Result |
|---|---|
| Engine Registry wiring suite | **12/12 PASS** (ER-01…ER-12) |
| Root suite (`node --test dist/tests/*.test.js`) | **771/771 PASS**, 0 fail (768 baseline + 3 new) |
| WP4: telecommunications, automobile, materials-metals | **15/15 PASS** (WP4 tests unmodified) |
| `npm run build:tsc` (root typecheck + emit) | exit 0 |
| `iips-platform` `tsc --noEmit` | exit 0 |
| `vite build` (output to /tmp) | exit 0 |
| Pack trees 016 / 017 / 020 | `33e4f3ac…` / `a2de07ff…` / `2b66ff12…`, 34 files each, unchanged |
| Freeze-manifest pins | **36/36** |
| GovTip (irr `arena/01a03e3b`) | `524739093adb…`, unchanged |
| `phase13-next` | `1a602d849cc4…`, unchanged |

**Environmental note (not a Gate B result):**
- A whole-tree `iips-platform` run shows 46 failures: the IES010…015 WP4 golden/replay tests plus six generic WP4 tests.
- They fail with ENOENT on `ies-010…015-*/datasets/*` packs, which do not exist in B1.
- The failure set is **identical** at baseline `8b45d9f` (run on a `git archive` export), so Gate B did not introduce it. These failures are outside Gate B scope and were not touched.
- Tier-3 was not re-pinned and not re-run.

## 7. Unchanged / not touched

- **D7:** code, golden outputs, calibration, replay data, P1 script and GovTip unchanged; the D7 pathway stays CLOSED.
- **D7 qualifications carried forward unchanged:** independence OPEN/NEGATIVE; adjudication report unrecoverable; Q5 OUTSIDE; DF-1; 33/33; IES-020 §28; IES-017 stale pack OPEN/NON-BLOCKING; adjudicator non-independence.
- **IES-017 qualification:**
  - The recovered `automobile-ontology-metadata-1.0.0.json` labels its contract "IES-017 v1.0 (D17 normative) — PROPOSED, NOT AUTHORITY". This is recorded here and was not altered.
  - The IES-017 74.9 / 71.9 values are preserved.
- **Other artifacts not modified:** A1 certificates, IVM, the replay baseline, WP4 tests, regression vectors, calibration, expected outputs, golden references, validation fixtures, freeze manifests, readiness certificates, Gate A records and all original authority records.
- **Other engines and surfaces:** the D42 IDs `sector.telecom` / `sector.auto` / `sector.materials` remain unexposed and forbidden, with no D42 certification transfer. Executive, Decision Matrix, Cross-Sector and Evidence are unaffected: the registry is consumed only by `EngineApiAdapter` → `GET /api/engines`.
- **Topology and scope:** no provider, API-route, topology, dependency, R-1, execute, production, promotion, release, tag or merge change.

## 8. Process disclosure

Before mutation, the local branch ref was re-pointed from `da43051` (a sandbox-restore artifact) to
the remote tip `8b45d9f`. This was local-only, done after proving the worktree was identical through
a temporary index. No reset, rebase, amend or force-push was performed.

## 9. Status

- GATE B = COMPLETE (on durable push; see the commit and report)
- B1 THREE-ENGINE IMPLEMENTATION / REGISTRY ADOPTION = COMPLETE
- B1 CERTIFICATION = NOT YET PERFORMED
- GATE C = CLOSED / NEXT AUTHORIZED GATE — not opened by this gate; no automatic progression
- Production / release / promotion / tagging: NOT GRANTED
