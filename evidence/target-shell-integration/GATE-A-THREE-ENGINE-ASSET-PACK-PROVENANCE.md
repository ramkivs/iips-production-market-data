# Institutional Investment Platform System (IIPS)
# B1 Three-Engine A1 Adoption — GATE A: Certified Asset-Pack Recovery & Provenance

**Decision ID:** `b1-three-engine-a1-adoption-2026-09-25-001` (authority commit `0e032c5e6002139fffdb0b4d7acbdca317c9853c`)
**Gate:** GATE A only — Certified Asset-Pack Recovery & Provenance
**Recording Agent:** Arena (Gate A execution + provenance recording)
**Recorded At (local, Asia/Calcutta):** 2026-09-25
**B1 baseline:** `d2710f3164eab7437b7c0455431210553c2d7a03` + authority record `0e032c5` (pre-Gate-A HEAD `0e032c5e6002139fffdb0b4d7acbdca317c9853c`)
**Source:** `https://github.com/ramkivs/iips-review-recovered.git` · `phase13-next` certified snapshot `c2dda91de8bd362d4766ed19d777a80e6976c9b5` (ancestor of `phase13-next` tip `1a602d849cc47331d4f61cc366ed0a343f80e287`)
**Machine-readable companion:** `evidence/target-shell-integration/GATE-A-THREE-ENGINE-ASSET-PACK-PROVENANCE.json`

---

## 1. Pre-mutation invariants (all asserted; any failure would have thrown with no mutation)

| Invariant | Result |
|---|---|
| B1 HEAD = remote = authority commit `0e032c5`; parent = `d2710f3`; delta from `d2710f3` = authority record only; worktree clean | PASS |
| Source commit `c2dda91` available; ancestor of `phase13-next` | PASS |
| IES-016 pack tree `ies-016-telecommunications` = `33e4f3ac97428da6d257b7a308c9c56256350997` | PASS |
| IES-017 pack tree `ies-017-automobile` = `a2de07ffeb9ddfd2eac84221f0a1a6fef42a88d9` | PASS |
| IES-020 pack tree `ies-020-materials-metals` = `2b66ff12d81288d5ba0d25b2a4bcd166a178b58d` | PASS |
| Destination pack paths absent in B1; not git-ignored; all source modes `100644` | PASS |
| Line-ending policy (`.gitattributes`: `eol=lf`) cannot alter content: 0 / 102 source blobs contain CR | PASS |

## 2. Method

Each missing object was read from the source blob, written to the B1 object store with filters
disabled (`git hash-object -w --no-filters`), asserted equal to the source blob ID, written to its
Decision-1 canonical path (repository-root `ies-0xx-*/`, source-relative path unchanged) with the
exact source bytes, and staged by blob ID. No normalization, no correction, no deletion, no edit.

## 3. Post-recovery verification

| Check | Result |
|---|---|
| A. Objects recovered | **90** (30 × IES-016, 30 × IES-017, 30 × IES-020) |
| B. Freeze-manifest `documentHashes` pins, each under its manifest's own `hashNormalization` rule (10 × CRLF-rendering, `architectureReview`/`authorityReview` × LF blob), hashed from B1 on-disk files | **36 / 36** |
| C. Source blob = destination on-disk blob = staged index blob | **90 / 90** |
| D. The 4 existing B1 pack objects per engine unchanged at their existing paths, not duplicated | **12 / 12** |
| IES-017 stale-pack values preserved (`AUTOMOBILE_DISCOVERY_PACK.md` §7 AB-002 `74.9`, AB-009 `71.9`; frozen `74.8` / `71.8` in B1 expected outputs) | PRESERVED — discrepancy remains registered OPEN, not corrected |
| Staged changes outside the three pack directories (excluding this provenance record and its JSON) | 0 |
| Non-addition changes (modify / delete / rename) | 0 |

## 4. Readiness-certificate labelling (Decision 2)

The following six recovered files are pack members recovered byte-exactly and unedited. By this
provenance record they are labelled **HISTORICAL / SOURCE-LINEAGE EVIDENCE — NOT B1 CERTIFICATION**:

- `ies-016-telecommunications/IES-016_IMPLEMENTATION_READINESS_CERTIFICATE.md`
- `ies-016-telecommunications/docs/IES-016_16_IMPLEMENTATION_READINESS_CERTIFICATE.md`
- `ies-017-automobile/IES-017_IMPLEMENTATION_READINESS_CERTIFICATE.md`
- `ies-017-automobile/docs/IES-017_16_IMPLEMENTATION_READINESS_CERTIFICATE.md`
- `ies-020-materials-metals/IES-020_IMPLEMENTATION_READINESS_CERTIFICATE.md`
- `ies-020-materials-metals/docs/IES-020_16_IMPLEMENTATION_READINESS_CERTIFICATE.md`

No A1 certificate record and no Integration Verification Matrix was copied into B1.

## 5. Not recovered — already present in B1 (untouched, not duplicated)

These 12 certified-pack objects are byte-identical to existing B1 objects and remain only at their
existing B1 paths. Their pack paths are intentionally absent in B1.

| Engine | Source pack path | Existing B1 path (unchanged) | Blob |
|---|---|---|---|
| IES-016 | `ies-016-telecommunications/calibration/telecommunications-calibration-1.0.0.json` | `iips-platform/src/sector-engines/telecommunications/telecommunications-calibration-1.0.0.json` | `178160fcbe0a30975c6796ac22c73a9bd03ab91a` |
| IES-016 | `ies-016-telecommunications/expected-outputs/telecommunications-expected-outputs-1.0.0.json` | `iips-platform/src/sector-engines/telecommunications/telecommunications-expected-outputs-1.0.0.json` | `0d45ffc44df6d61a6f95dac15a12cb6f88be3155` |
| IES-016 | `ies-016-telecommunications/fixtures/telecommunications-golden-reference-1.0.0.json` | `iips-platform/src/sector-engines/telecommunications/telecommunications-golden-reference-1.0.0.json` | `f0dfc647b8e0220d04a241902a82899e3a667393` |
| IES-016 | `ies-016-telecommunications/fixtures/telecommunications-validation-fixtures-1.0.0.json` | `iips-platform/src/sector-engines/telecommunications/telecommunications-validation-fixtures-1.0.0.json` | `25accdd952a6f774968e51b3a18eb6f4aa1dbf05` |
| IES-017 | `ies-017-automobile/calibration/automobile-calibration-1.0.0.json` | `iips-platform/src/sector-engines/automobile/automobile-calibration-1.0.0.json` | `e3f84ede6f5e89580aa451a689c0b5689cf8674e` |
| IES-017 | `ies-017-automobile/expected-outputs/automobile-expected-outputs-1.0.0.json` | `iips-platform/src/sector-engines/automobile/automobile-expected-outputs-1.0.0.json` | `b9982d744d92d592714dcc5b1e8599bed63752f2` |
| IES-017 | `ies-017-automobile/fixtures/automobile-golden-reference-1.0.0.json` | `iips-platform/src/sector-engines/automobile/automobile-golden-reference-1.0.0.json` | `11dcd3953046c4e27f80a8ffc71c2c7ef59ede47` |
| IES-017 | `ies-017-automobile/fixtures/automobile-validation-fixtures-1.0.0.json` | `iips-platform/src/sector-engines/automobile/automobile-validation-fixtures-1.0.0.json` | `fa9bb6df3560bd2449486d5ac9dbc889ff7ac56d` |
| IES-020 | `ies-020-materials-metals/calibration/materials-metals-calibration-1.0.0.json` | `iips-platform/src/sector-engines/materials-metals/materials-metals-calibration-1.0.0.json` | `ceea1d5fe7c9e4c56f76f6d34efcbbfef311cccf` |
| IES-020 | `ies-020-materials-metals/expected-outputs/materials-metals-expected-outputs-1.0.0.json` | `iips-platform/src/sector-engines/materials-metals/materials-metals-expected-outputs-1.0.0.json` | `3e67cb6f01fdc7a2459d6f4376e54cfa4b89cf2e` |
| IES-020 | `ies-020-materials-metals/fixtures/materials-metals-golden-reference-1.0.0.json` | `iips-platform/src/sector-engines/materials-metals/materials-metals-golden-reference-1.0.0.json` | `1b601093cb09d607a7725bfed6b7cc4689c3f1e0` |
| IES-020 | `ies-020-materials-metals/fixtures/materials-metals-validation-fixtures-1.0.0.json` | `iips-platform/src/sector-engines/materials-metals/materials-metals-validation-fixtures-1.0.0.json` | `000412669a40a7b36e6bdd85bcbb9196dd5ab2e4` |
## 6. Recovered objects (90)

Source repository `https://github.com/ramkivs/iips-review-recovered.git`, source commit
`c2dda91de8bd362d4766ed19d777a80e6976c9b5`, source tree = the engine's pack tree in §1; source path
= destination path; mode `100644`.

| Engine | Destination path | Class | Source blob | Destination blob | Label |
|---|---|---|---|---|---|
| IES-016 | `ies-016-telecommunications/D16_AUTHORITY_REVIEW.md` | governance-review-doc | `7f796754cb04eeb75e87000c760bbef587eb060c` | `7f796754cb04eeb75e87000c760bbef587eb060c` |  |
| IES-016 | `ies-016-telecommunications/IES-016_ARCHITECTURE_REVIEW.md` | governance-review-doc | `ec715ca1e2305d11bb51f2aac7a307a74b06042e` | `ec715ca1e2305d11bb51f2aac7a307a74b06042e` |  |
| IES-016 | `ies-016-telecommunications/IES-016_FREEZE_MANIFEST.json` | freeze-manifest | `70018bdb38849d50af7258f62d0341ac2bf64f1a` | `70018bdb38849d50af7258f62d0341ac2bf64f1a` |  |
| IES-016 | `ies-016-telecommunications/IES-016_IMPLEMENTATION_READINESS_CERTIFICATE.md` | governance-review-doc | `d764f276d980b6843e1b68939803299181bd3a47` | `d764f276d980b6843e1b68939803299181bd3a47` | HISTORICAL / SOURCE-LINEAGE EVIDENCE — NOT B1 CERTIFICATION |
| IES-016 | `ies-016-telecommunications/RELEASE_NOTES_IES-016_v1.0.0.md` | governance-review-doc | `78a9b13fc566077ce562057ee03a0092d158471b` | `78a9b13fc566077ce562057ee03a0092d158471b` |  |
| IES-016 | `ies-016-telecommunications/TELECOMMUNICATIONS_DISCOVERY_PACK.md` | governance-review-doc | `68aae104dd3a0ccad8122d5770bd8d2c61637ba6` | `68aae104dd3a0ccad8122d5770bd8d2c61637ba6` |  |
| IES-016 | `ies-016-telecommunications/TELECOMMUNICATIONS_ENGINE_ACCEPTANCE_MATRIX.md` | governance-review-doc | `0a45484582300d106c104e093a176d9ba52f6aec` | `0a45484582300d106c104e093a176d9ba52f6aec` |  |
| IES-016 | `ies-016-telecommunications/TELECOMMUNICATIONS_IMPLEMENTATION_RISK_REGISTER.md` | governance-review-doc | `16b37ee9f3d0b20a0849c2314ee66cb58e08e383` | `16b37ee9f3d0b20a0849c2314ee66cb58e08e383` |  |
| IES-016 | `ies-016-telecommunications/contract-tests/generate_expected_outputs.py` | contract-test-generator | `c69ce2eb5d989f63a0618406b103dc398ebc4948` | `c69ce2eb5d989f63a0618406b103dc398ebc4948` |  |
| IES-016 | `ies-016-telecommunications/docs/IES-016_01_README.md` | specification-doc | `04bb92ba2af021769f1046ebc8cd0444ab329849` | `04bb92ba2af021769f1046ebc8cd0444ab329849` |  |
| IES-016 | `ies-016-telecommunications/docs/IES-016_02_EXECUTIVE_SUMMARY.md` | specification-doc | `044deb495c5c97318f4568f736195d6227c1262f` | `044deb495c5c97318f4568f736195d6227c1262f` |  |
| IES-016 | `ies-016-telecommunications/docs/IES-016_03_INDUSTRY_MODEL.md` | specification-doc | `83b4697e37ac419784d90681e66e25708a73d581` | `83b4697e37ac419784d90681e66e25708a73d581` |  |
| IES-016 | `ies-016-telecommunications/docs/IES-016_04_BUSINESS_MODEL.md` | specification-doc | `ad81f6ddb013a1d85963c9d06aa6a0277781c19f` | `ad81f6ddb013a1d85963c9d06aa6a0277781c19f` |  |
| IES-016 | `ies-016-telecommunications/docs/IES-016_05_METHODOLOGY_PRINCIPLES.md` | specification-doc | `7216977ee87d488a7a16b178a62db9ae8fcd11ec` | `7216977ee87d488a7a16b178a62db9ae8fcd11ec` |  |
| IES-016 | `ies-016-telecommunications/docs/IES-016_06_METRIC_LIBRARY.md` | specification-doc | `596d2158f9fb49c3b637c21e6a15ae8779cb0ea4` | `596d2158f9fb49c3b637c21e6a15ae8779cb0ea4` |  |
| IES-016 | `ies-016-telecommunications/docs/IES-016_07_SCORE_ENGINE.md` | specification-doc | `607610d7ee3b8e483104c107a1f7492b76fb6b5b` | `607610d7ee3b8e483104c107a1f7492b76fb6b5b` |  |
| IES-016 | `ies-016-telecommunications/docs/IES-016_08_FORMULA_LIBRARY.md` | specification-doc | `8d03d9e20aca7ba71c529b5f5f603744e34bf145` | `8d03d9e20aca7ba71c529b5f5f603744e34bf145` |  |
| IES-016 | `ies-016-telecommunications/docs/IES-016_09_CALIBRATION.md` | specification-doc | `e45d71995a42f5a0d19ce59eefa794fdf560aa52` | `e45d71995a42f5a0d19ce59eefa794fdf560aa52` |  |
| IES-016 | `ies-016-telecommunications/docs/IES-016_10_DECISION_ENGINE.md` | specification-doc | `0927629c9de3585cd3cc87a90b4540c994afad6f` | `0927629c9de3585cd3cc87a90b4540c994afad6f` |  |
| IES-016 | `ies-016-telecommunications/docs/IES-016_11_EVIDENCE_FRAMEWORK.md` | specification-doc | `30764c44976e454997fb794ee632b7f6ea92e72b` | `30764c44976e454997fb794ee632b7f6ea92e72b` |  |
| IES-016 | `ies-016-telecommunications/docs/IES-016_12_VALIDATION.md` | specification-doc | `9dd39a402ef6b66acfa9b88f2d78b7f0ac3e89fb` | `9dd39a402ef6b66acfa9b88f2d78b7f0ac3e89fb` |  |
| IES-016 | `ies-016-telecommunications/docs/IES-016_13_ARENA_IMPLEMENTATION_SPECIFICATION.md` | specification-doc | `279c138862eb82d2e842d9bb876c3e9274b2c1a0` | `279c138862eb82d2e842d9bb876c3e9274b2c1a0` |  |
| IES-016 | `ies-016-telecommunications/docs/IES-016_14_REFERENCE_ASSET_GOVERNANCE.md` | specification-doc | `68077fd69d62e4fea27601529a7814d9479cc3b9` | `68077fd69d62e4fea27601529a7814d9479cc3b9` |  |
| IES-016 | `ies-016-telecommunications/docs/IES-016_15_NORMATIVE_CALCULATION_APPENDIX.md` | specification-doc | `a5f9286b49cdeef8e0e326048d579b96dd74d1d2` | `a5f9286b49cdeef8e0e326048d579b96dd74d1d2` |  |
| IES-016 | `ies-016-telecommunications/docs/IES-016_16_IMPLEMENTATION_READINESS_CERTIFICATE.md` | specification-doc | `ce896d1023c276e155595d0879907fc4aadf610a` | `ce896d1023c276e155595d0879907fc4aadf610a` | HISTORICAL / SOURCE-LINEAGE EVIDENCE — NOT B1 CERTIFICATION |
| IES-016 | `ies-016-telecommunications/docs/IES-016_17_MASTER_INDEX.md` | specification-doc | `ae0bee41b7eccab1aab4860a6d40b7df7677585e` | `ae0bee41b7eccab1aab4860a6d40b7df7677585e` |  |
| IES-016 | `ies-016-telecommunications/docs/IES-016_18_DATA_DICTIONARY.md` | specification-doc | `793d7f8a7b89ff9d509af164629e4dd025d8ed63` | `793d7f8a7b89ff9d509af164629e4dd025d8ed63` |  |
| IES-016 | `ies-016-telecommunications/docs/IES-016_19_REFERENCE_DATA_SOURCES.md` | specification-doc | `4d86bbdf7ecf48df4264c87720e1c4cf3bb47fbb` | `4d86bbdf7ecf48df4264c87720e1c4cf3bb47fbb` |  |
| IES-016 | `ies-016-telecommunications/replay-datasets/telecommunications-replay-dataset-1.0.0.json` | replay-dataset | `ed6bbeb8b127f45ac8c8d99f9baee8c42bd60001` | `ed6bbeb8b127f45ac8c8d99f9baee8c42bd60001` |  |
| IES-016 | `ies-016-telecommunications/telecommunications-ontology-metadata-1.0.0.json` | ontology-metadata | `31383863e126a6688bd95249522e654c933ec6f1` | `31383863e126a6688bd95249522e654c933ec6f1` |  |
| IES-017 | `ies-017-automobile/AUTOMOBILE_DISCOVERY_PACK.md` | governance-review-doc | `e0ad759f4be4231b18959ae6f22aaa3ec6e2ab0b` | `e0ad759f4be4231b18959ae6f22aaa3ec6e2ab0b` |  |
| IES-017 | `ies-017-automobile/AUTOMOBILE_ENGINE_ACCEPTANCE_MATRIX.md` | governance-review-doc | `8707125b545d36541e1199e3f35d425fdda3613d` | `8707125b545d36541e1199e3f35d425fdda3613d` |  |
| IES-017 | `ies-017-automobile/AUTOMOBILE_IMPLEMENTATION_RISK_REGISTER.md` | governance-review-doc | `7158304538f9e70e68b6cfe99a51386587dd0eb2` | `7158304538f9e70e68b6cfe99a51386587dd0eb2` |  |
| IES-017 | `ies-017-automobile/D17_AUTHORITY_REVIEW.md` | governance-review-doc | `70f46417f5a906965f001911463eedd5345c2201` | `70f46417f5a906965f001911463eedd5345c2201` |  |
| IES-017 | `ies-017-automobile/IES-017_ARCHITECTURE_REVIEW.md` | governance-review-doc | `f16b52ec1b5c152084fc131eba29888436adb8ec` | `f16b52ec1b5c152084fc131eba29888436adb8ec` |  |
| IES-017 | `ies-017-automobile/IES-017_FREEZE_MANIFEST.json` | freeze-manifest | `a7d1190edbd8bf0bfc5b852da466c5e03b6f2cd3` | `a7d1190edbd8bf0bfc5b852da466c5e03b6f2cd3` |  |
| IES-017 | `ies-017-automobile/IES-017_IMPLEMENTATION_READINESS_CERTIFICATE.md` | governance-review-doc | `a1f8ee7f9a7e7bdb572041f9cbbe0357a87bc77f` | `a1f8ee7f9a7e7bdb572041f9cbbe0357a87bc77f` | HISTORICAL / SOURCE-LINEAGE EVIDENCE — NOT B1 CERTIFICATION |
| IES-017 | `ies-017-automobile/RELEASE_NOTES_IES-017_v1.0.0.md` | governance-review-doc | `51ab933dd23d026ac7f7cda4b76b1e8d4d6d5c38` | `51ab933dd23d026ac7f7cda4b76b1e8d4d6d5c38` |  |
| IES-017 | `ies-017-automobile/automobile-ontology-metadata-1.0.0.json` | ontology-metadata | `c0cbe1659642ff6bcc2e767e06d24be081c4cd7f` | `c0cbe1659642ff6bcc2e767e06d24be081c4cd7f` |  |
| IES-017 | `ies-017-automobile/contract-tests/generate_expected_outputs.py` | contract-test-generator | `ec599ce1aafb26fe645f238e1f953521e60795f8` | `ec599ce1aafb26fe645f238e1f953521e60795f8` |  |
| IES-017 | `ies-017-automobile/docs/IES-017_01_README.md` | specification-doc | `6467d6639364fd6deb260fd4a0c0a6e051d0d577` | `6467d6639364fd6deb260fd4a0c0a6e051d0d577` |  |
| IES-017 | `ies-017-automobile/docs/IES-017_02_EXECUTIVE_SUMMARY.md` | specification-doc | `7c625c79545d22c8786979f1f95dd26ab4351f68` | `7c625c79545d22c8786979f1f95dd26ab4351f68` |  |
| IES-017 | `ies-017-automobile/docs/IES-017_03_INDUSTRY_MODEL.md` | specification-doc | `5cb365b3d0fcecd8e9845fa27e91a7979753710c` | `5cb365b3d0fcecd8e9845fa27e91a7979753710c` |  |
| IES-017 | `ies-017-automobile/docs/IES-017_04_BUSINESS_MODEL.md` | specification-doc | `05366e8ec69ffc44a6b7f88ecdf222fb8c782cd8` | `05366e8ec69ffc44a6b7f88ecdf222fb8c782cd8` |  |
| IES-017 | `ies-017-automobile/docs/IES-017_05_METHODOLOGY_PRINCIPLES.md` | specification-doc | `95f6b97b3a1c96218878600d5a3f8c599636dd1d` | `95f6b97b3a1c96218878600d5a3f8c599636dd1d` |  |
| IES-017 | `ies-017-automobile/docs/IES-017_06_METRIC_LIBRARY.md` | specification-doc | `f78f3b8793fe58ed6ef45ed1b147e66e7fcf08e4` | `f78f3b8793fe58ed6ef45ed1b147e66e7fcf08e4` |  |
| IES-017 | `ies-017-automobile/docs/IES-017_07_SCORE_ENGINE.md` | specification-doc | `196c5a9ccb9c5145905d8398492e0bb2bc39027c` | `196c5a9ccb9c5145905d8398492e0bb2bc39027c` |  |
| IES-017 | `ies-017-automobile/docs/IES-017_08_FORMULA_LIBRARY.md` | specification-doc | `0a6224c41b3a4fe0bf6c932cf6f9f945fce2a007` | `0a6224c41b3a4fe0bf6c932cf6f9f945fce2a007` |  |
| IES-017 | `ies-017-automobile/docs/IES-017_09_CALIBRATION.md` | specification-doc | `5ae5730390fb6f1371bd284fd7f6c55945423b55` | `5ae5730390fb6f1371bd284fd7f6c55945423b55` |  |
| IES-017 | `ies-017-automobile/docs/IES-017_10_DECISION_ENGINE.md` | specification-doc | `21d202e1f005622826697483cbba848813a2e38e` | `21d202e1f005622826697483cbba848813a2e38e` |  |
| IES-017 | `ies-017-automobile/docs/IES-017_11_EVIDENCE_FRAMEWORK.md` | specification-doc | `c462287f107f53ba62ca570923801974bee5b7bd` | `c462287f107f53ba62ca570923801974bee5b7bd` |  |
| IES-017 | `ies-017-automobile/docs/IES-017_12_VALIDATION.md` | specification-doc | `7532ee5ab3f7aa68485e79735db6aefcf45b81eb` | `7532ee5ab3f7aa68485e79735db6aefcf45b81eb` |  |
| IES-017 | `ies-017-automobile/docs/IES-017_13_ARENA_IMPLEMENTATION_SPECIFICATION.md` | specification-doc | `cd8f7be57074bd7eb67a76390b4ae600f4a9fc7b` | `cd8f7be57074bd7eb67a76390b4ae600f4a9fc7b` |  |
| IES-017 | `ies-017-automobile/docs/IES-017_14_REFERENCE_ASSET_GOVERNANCE.md` | specification-doc | `033c398fa2d2481f1f1c3d4bde96358e5a41021d` | `033c398fa2d2481f1f1c3d4bde96358e5a41021d` |  |
| IES-017 | `ies-017-automobile/docs/IES-017_15_NORMATIVE_CALCULATION_APPENDIX.md` | specification-doc | `7e245d82db9a9125527e45dc8d2498e2d4495a92` | `7e245d82db9a9125527e45dc8d2498e2d4495a92` |  |
| IES-017 | `ies-017-automobile/docs/IES-017_16_IMPLEMENTATION_READINESS_CERTIFICATE.md` | specification-doc | `4fc947417fc4500826646acf89cc43b043dbc0be` | `4fc947417fc4500826646acf89cc43b043dbc0be` | HISTORICAL / SOURCE-LINEAGE EVIDENCE — NOT B1 CERTIFICATION |
| IES-017 | `ies-017-automobile/docs/IES-017_17_MASTER_INDEX.md` | specification-doc | `1f282a2710fca90599dbbe8c8aa39c3375426513` | `1f282a2710fca90599dbbe8c8aa39c3375426513` |  |
| IES-017 | `ies-017-automobile/docs/IES-017_18_DATA_DICTIONARY.md` | specification-doc | `28536473a7a1e716268b90bdd179b470888e9add` | `28536473a7a1e716268b90bdd179b470888e9add` |  |
| IES-017 | `ies-017-automobile/docs/IES-017_19_REFERENCE_DATA_SOURCES.md` | specification-doc | `49bc75805e3d8785be0e33dd570bf15569a2bfa1` | `49bc75805e3d8785be0e33dd570bf15569a2bfa1` |  |
| IES-017 | `ies-017-automobile/replay-datasets/automobile-replay-dataset-1.0.0.json` | replay-dataset | `f4d599631ee27b48aa808472f5cd9cbb0b108cff` | `f4d599631ee27b48aa808472f5cd9cbb0b108cff` |  |
| IES-020 | `ies-020-materials-metals/D20_AUTHORITY_REVIEW.md` | governance-review-doc | `de6bb32b6e6c7ca5d3de6525c2b7f5b9d11d5694` | `de6bb32b6e6c7ca5d3de6525c2b7f5b9d11d5694` |  |
| IES-020 | `ies-020-materials-metals/IES-020_ARCHITECTURE_REVIEW.md` | governance-review-doc | `b3c92b1ed9ece1bea1aa63d175825b386acc7e45` | `b3c92b1ed9ece1bea1aa63d175825b386acc7e45` |  |
| IES-020 | `ies-020-materials-metals/IES-020_FREEZE_MANIFEST.json` | freeze-manifest | `0d43a538734c9c13645778b0eadfbd978730f637` | `0d43a538734c9c13645778b0eadfbd978730f637` |  |
| IES-020 | `ies-020-materials-metals/IES-020_IMPLEMENTATION_READINESS_CERTIFICATE.md` | governance-review-doc | `7533e1d69dfd32b1f2781680e885e536a714f180` | `7533e1d69dfd32b1f2781680e885e536a714f180` | HISTORICAL / SOURCE-LINEAGE EVIDENCE — NOT B1 CERTIFICATION |
| IES-020 | `ies-020-materials-metals/MATERIALS_METALS_DISCOVERY_PACK.md` | governance-review-doc | `7677ec47a335d0157411830a80aba29912dc97b5` | `7677ec47a335d0157411830a80aba29912dc97b5` |  |
| IES-020 | `ies-020-materials-metals/MATERIALS_METALS_ENGINE_ACCEPTANCE_MATRIX.md` | governance-review-doc | `12a04073ff0334bb3fe7ca6c1c0b8325da79059c` | `12a04073ff0334bb3fe7ca6c1c0b8325da79059c` |  |
| IES-020 | `ies-020-materials-metals/MATERIALS_METALS_IMPLEMENTATION_RISK_REGISTER.md` | governance-review-doc | `159754c370e066dec7195ddbc771bc5ef853480d` | `159754c370e066dec7195ddbc771bc5ef853480d` |  |
| IES-020 | `ies-020-materials-metals/RELEASE_NOTES_IES-020_v1.0.0.md` | governance-review-doc | `711bc4a5fc8728a00c3cfb8909906a0ff4f4f14e` | `711bc4a5fc8728a00c3cfb8909906a0ff4f4f14e` |  |
| IES-020 | `ies-020-materials-metals/contract-tests/generate_expected_outputs.py` | contract-test-generator | `2552b6590b75a5bbbc3d5893e07fb27468991e48` | `2552b6590b75a5bbbc3d5893e07fb27468991e48` |  |
| IES-020 | `ies-020-materials-metals/docs/IES-020_01_README.md` | specification-doc | `f8098ea0178911860f3d1836a8b1987e4469af4b` | `f8098ea0178911860f3d1836a8b1987e4469af4b` |  |
| IES-020 | `ies-020-materials-metals/docs/IES-020_02_EXECUTIVE_SUMMARY.md` | specification-doc | `6ba484b2cae33329fd5a08396488afc9eafee1d9` | `6ba484b2cae33329fd5a08396488afc9eafee1d9` |  |
| IES-020 | `ies-020-materials-metals/docs/IES-020_03_INDUSTRY_MODEL.md` | specification-doc | `fad4bdf6e4fc0763c4ddc620914075532dcb3859` | `fad4bdf6e4fc0763c4ddc620914075532dcb3859` |  |
| IES-020 | `ies-020-materials-metals/docs/IES-020_04_BUSINESS_MODEL.md` | specification-doc | `270138b0114c3fb9e410bb0ce6cbbc917e75ddec` | `270138b0114c3fb9e410bb0ce6cbbc917e75ddec` |  |
| IES-020 | `ies-020-materials-metals/docs/IES-020_05_METHODOLOGY_PRINCIPLES.md` | specification-doc | `31567146132b68006494ddc8e458ae01ffe2c82b` | `31567146132b68006494ddc8e458ae01ffe2c82b` |  |
| IES-020 | `ies-020-materials-metals/docs/IES-020_06_METRIC_LIBRARY.md` | specification-doc | `d8ad93fd560fd9aaf28516b8e1dd11b7b49f75d3` | `d8ad93fd560fd9aaf28516b8e1dd11b7b49f75d3` |  |
| IES-020 | `ies-020-materials-metals/docs/IES-020_07_SCORE_ENGINE.md` | specification-doc | `f0391550ab1748af00232b04c6b80f46cb56a8ca` | `f0391550ab1748af00232b04c6b80f46cb56a8ca` |  |
| IES-020 | `ies-020-materials-metals/docs/IES-020_08_FORMULA_LIBRARY.md` | specification-doc | `0b9127a8140b1db320400ffaf7928f065c990d2f` | `0b9127a8140b1db320400ffaf7928f065c990d2f` |  |
| IES-020 | `ies-020-materials-metals/docs/IES-020_09_CALIBRATION.md` | specification-doc | `82859c5b8cafe9783907726589ef0fd79f36b065` | `82859c5b8cafe9783907726589ef0fd79f36b065` |  |
| IES-020 | `ies-020-materials-metals/docs/IES-020_10_DECISION_ENGINE.md` | specification-doc | `9d45204c19a71b6388d2d2b077bf94ab98357450` | `9d45204c19a71b6388d2d2b077bf94ab98357450` |  |
| IES-020 | `ies-020-materials-metals/docs/IES-020_11_EVIDENCE_FRAMEWORK.md` | specification-doc | `b070176f7c5afe63fc6a1faa07796f5c1db1ea45` | `b070176f7c5afe63fc6a1faa07796f5c1db1ea45` |  |
| IES-020 | `ies-020-materials-metals/docs/IES-020_12_VALIDATION.md` | specification-doc | `1b9791976776a7e127528717f4265c23db1a33f4` | `1b9791976776a7e127528717f4265c23db1a33f4` |  |
| IES-020 | `ies-020-materials-metals/docs/IES-020_13_ARENA_IMPLEMENTATION_SPECIFICATION.md` | specification-doc | `7892c1ed89e172cc9d9e787d80b6cb9bb618761f` | `7892c1ed89e172cc9d9e787d80b6cb9bb618761f` |  |
| IES-020 | `ies-020-materials-metals/docs/IES-020_14_REFERENCE_ASSET_GOVERNANCE.md` | specification-doc | `4ae7582040ae55e99434501fe070045ccb9b144d` | `4ae7582040ae55e99434501fe070045ccb9b144d` |  |
| IES-020 | `ies-020-materials-metals/docs/IES-020_15_NORMATIVE_CALCULATION_APPENDIX.md` | specification-doc | `bd4a482bfb5ed83ef91c115d3044414b20b34bc1` | `bd4a482bfb5ed83ef91c115d3044414b20b34bc1` |  |
| IES-020 | `ies-020-materials-metals/docs/IES-020_16_IMPLEMENTATION_READINESS_CERTIFICATE.md` | specification-doc | `735b71ab8d26ed77197768cd7a9775e2276db26f` | `735b71ab8d26ed77197768cd7a9775e2276db26f` | HISTORICAL / SOURCE-LINEAGE EVIDENCE — NOT B1 CERTIFICATION |
| IES-020 | `ies-020-materials-metals/docs/IES-020_17_MASTER_INDEX.md` | specification-doc | `590746039eabd09595e0b8444bd0d3d169515a6c` | `590746039eabd09595e0b8444bd0d3d169515a6c` |  |
| IES-020 | `ies-020-materials-metals/docs/IES-020_18_DATA_DICTIONARY.md` | specification-doc | `f8d25869614c46128c4ba8a9ac266df67054af74` | `f8d25869614c46128c4ba8a9ac266df67054af74` |  |
| IES-020 | `ies-020-materials-metals/docs/IES-020_19_REFERENCE_DATA_SOURCES.md` | specification-doc | `0aa8989d8ba2844cb98f1afdbe2d59861e304106` | `0aa8989d8ba2844cb98f1afdbe2d59861e304106` |  |
| IES-020 | `ies-020-materials-metals/materials-metals-ontology-metadata-1.0.0.json` | ontology-metadata | `8ea6b53c08aad0c3cbb7fb04020d3f8b8903ab25` | `8ea6b53c08aad0c3cbb7fb04020d3f8b8903ab25` |  |
| IES-020 | `ies-020-materials-metals/replay-datasets/materials-metals-replay-dataset-1.0.0.json` | replay-dataset | `62ace6612c289a38ac6bb75ee5795c56be7650f5` | `62ace6612c289a38ac6bb75ee5795c56be7650f5` |  |
## 7. Freeze-manifest pin verification (36)

| Engine | Key | Rendering | Pinned SHA-256 | Verified against (B1 path) |
|---|---|---|---|---|
| IES-016 | calibration | CRLF | `2d22256e2c13b0e5…` | `iips-platform/src/sector-engines/telecommunications/telecommunications-calibration-1.0.0.json` |
| IES-016 | goldenDataset | CRLF | `feb521c8cdd55f5e…` | `iips-platform/src/sector-engines/telecommunications/telecommunications-golden-reference-1.0.0.json` |
| IES-016 | expectedOutputs | CRLF | `18341d76da1c7577…` | `iips-platform/src/sector-engines/telecommunications/telecommunications-expected-outputs-1.0.0.json` |
| IES-016 | replayDataset | CRLF | `097ca980c103a19b…` | `ies-016-telecommunications/replay-datasets/telecommunications-replay-dataset-1.0.0.json` |
| IES-016 | validationFixtures | CRLF | `783d68ebc9d31188…` | `iips-platform/src/sector-engines/telecommunications/telecommunications-validation-fixtures-1.0.0.json` |
| IES-016 | ontologyMetadata | CRLF | `b12cf97abd1d6c62…` | `ies-016-telecommunications/telecommunications-ontology-metadata-1.0.0.json` |
| IES-016 | discoveryPack | CRLF | `4f35d9f51cb29d03…` | `ies-016-telecommunications/TELECOMMUNICATIONS_DISCOVERY_PACK.md` |
| IES-016 | acceptanceMatrix | CRLF | `1e344fa5e65e46d6…` | `ies-016-telecommunications/TELECOMMUNICATIONS_ENGINE_ACCEPTANCE_MATRIX.md` |
| IES-016 | riskRegister | CRLF | `bb45049d2d22facd…` | `ies-016-telecommunications/TELECOMMUNICATIONS_IMPLEMENTATION_RISK_REGISTER.md` |
| IES-016 | contractTestGenerator | CRLF | `807a7dafba619d01…` | `ies-016-telecommunications/contract-tests/generate_expected_outputs.py` |
| IES-016 | architectureReview | LF | `96ef579479a55aa8…` | `ies-016-telecommunications/IES-016_ARCHITECTURE_REVIEW.md` |
| IES-016 | authorityReview | LF | `369cadebf1953fcd…` | `ies-016-telecommunications/D16_AUTHORITY_REVIEW.md` |
| IES-017 | calibration | CRLF | `64c8186debd575f6…` | `iips-platform/src/sector-engines/automobile/automobile-calibration-1.0.0.json` |
| IES-017 | goldenDataset | CRLF | `d912224225c9364e…` | `iips-platform/src/sector-engines/automobile/automobile-golden-reference-1.0.0.json` |
| IES-017 | expectedOutputs | CRLF | `ae532792a759b56b…` | `iips-platform/src/sector-engines/automobile/automobile-expected-outputs-1.0.0.json` |
| IES-017 | replayDataset | CRLF | `fce68b0af3ef09ab…` | `ies-017-automobile/replay-datasets/automobile-replay-dataset-1.0.0.json` |
| IES-017 | validationFixtures | CRLF | `e5a3cb5267666bf5…` | `iips-platform/src/sector-engines/automobile/automobile-validation-fixtures-1.0.0.json` |
| IES-017 | ontologyMetadata | CRLF | `bbd293b130d0fd5f…` | `ies-017-automobile/automobile-ontology-metadata-1.0.0.json` |
| IES-017 | discoveryPack | CRLF | `cd7096f23949877e…` | `ies-017-automobile/AUTOMOBILE_DISCOVERY_PACK.md` |
| IES-017 | acceptanceMatrix | CRLF | `fb399c59244f7bc2…` | `ies-017-automobile/AUTOMOBILE_ENGINE_ACCEPTANCE_MATRIX.md` |
| IES-017 | riskRegister | CRLF | `f18359007c594381…` | `ies-017-automobile/AUTOMOBILE_IMPLEMENTATION_RISK_REGISTER.md` |
| IES-017 | contractTestGenerator | CRLF | `45fe3aab3d16a733…` | `ies-017-automobile/contract-tests/generate_expected_outputs.py` |
| IES-017 | architectureReview | LF | `91905ce5d0d3c2e4…` | `ies-017-automobile/IES-017_ARCHITECTURE_REVIEW.md` |
| IES-017 | authorityReview | LF | `1175f2a66123e396…` | `ies-017-automobile/D17_AUTHORITY_REVIEW.md` |
| IES-020 | calibration | CRLF | `bb0afb700d31b272…` | `iips-platform/src/sector-engines/materials-metals/materials-metals-calibration-1.0.0.json` |
| IES-020 | goldenDataset | CRLF | `ec289d7701f3723e…` | `iips-platform/src/sector-engines/materials-metals/materials-metals-golden-reference-1.0.0.json` |
| IES-020 | expectedOutputs | CRLF | `1f1414dfe313fdcc…` | `iips-platform/src/sector-engines/materials-metals/materials-metals-expected-outputs-1.0.0.json` |
| IES-020 | replayDataset | CRLF | `b8c8409d06c81790…` | `ies-020-materials-metals/replay-datasets/materials-metals-replay-dataset-1.0.0.json` |
| IES-020 | validationFixtures | CRLF | `d090b1b2e0959444…` | `iips-platform/src/sector-engines/materials-metals/materials-metals-validation-fixtures-1.0.0.json` |
| IES-020 | ontologyMetadata | CRLF | `819a663498f5f7b7…` | `ies-020-materials-metals/materials-metals-ontology-metadata-1.0.0.json` |
| IES-020 | discoveryPack | CRLF | `fe4d1b4e386ad379…` | `ies-020-materials-metals/MATERIALS_METALS_DISCOVERY_PACK.md` |
| IES-020 | acceptanceMatrix | CRLF | `7fcd2d5bb57c8785…` | `ies-020-materials-metals/MATERIALS_METALS_ENGINE_ACCEPTANCE_MATRIX.md` |
| IES-020 | riskRegister | CRLF | `8cb2486f84c81d5c…` | `ies-020-materials-metals/MATERIALS_METALS_IMPLEMENTATION_RISK_REGISTER.md` |
| IES-020 | contractTestGenerator | CRLF | `1f7ee122d8d7e3a2…` | `ies-020-materials-metals/contract-tests/generate_expected_outputs.py` |
| IES-020 | architectureReview | LF | `da37dff062853d48…` | `ies-020-materials-metals/IES-020_ARCHITECTURE_REVIEW.md` |
| IES-020 | authorityReview | LF | `8c309a1aa9ef35b8…` | `ies-020-materials-metals/D20_AUTHORITY_REVIEW.md` |
## 8. Baseline tests (run unchanged)

| Suite | Before Gate A (`0e032c5`, clean export) | After Gate A |
|---|---|---|
| Root `dist/tests/*.test.js` | 768 pass / 0 fail | 768 pass / 0 fail |
| `iips-platform` three-engine regression + Program v1.1 replay (`telecommunications-*`, `automobile-*`, `materials-metals-*`, `program-v1.1-track3-replay-certification`) | 86 pass / 12 fail | 86 pass / 12 fail — identical failing set |

## 9. Qualifications

- **Q-A1 — Pre-existing WP4 validation failures (not caused by Gate A).** The 12 failing tests are
  `IES016/017/020-WP4-ACC1…ACC4` in `iips-platform/tests/regression/*-wp4-validation.test.ts`, which
  read the full pack layout at repository-root paths. Before Gate A they failed on the absent pack
  (`fixtures/` and `replay-datasets/`). After Gate A the replay-dataset cause is resolved; they fail
  only on `ies-0xx-*/fixtures/<sector>-{golden-reference,validation-fixtures}-1.0.0.json` — objects
  that are byte-identical to existing B1 copies and were, per the authority act, not duplicated.
  Tests were not modified. Resolution requires a separate RAMKI decision; it is not performed here.
- **Q-A2 — Recovered pack directories are 30/34 by design.** The B1 pack trees therefore do not equal
  the source pack tree IDs; per-object blob identity (90/90) and manifest pins (36/36) establish
  content identity.
- **Carried D7 qualifications (unchanged):** D7 independence OPEN / NEGATIVE; adjudication source
  artifact (SHA-256 `2296764a…`, 13,755 bytes) unrecoverable; Q5 OUTSIDE CERTIFICATION CRITERION;
  DF-1 NON-BLOCKING (byte identity not claimed); 33/33 manifest qualification NON-BLOCKING; IES-020
  §28 Q1/Q2/Q3/Q5 OUTSIDE, Q4 NON-BLOCKING; IES-017 stale-pack registered OPEN; adjudicator
  non-independence.

## 10. Explicit Non-Effects

- GATE B REMAINS CLOSED. GATE C REMAINS CLOSED. Registry remains 10 engines (IES-006…015).
- NOT modified: `EngineRegistry.ts`, `EngineApiAdapter.ts`, `engine_registry_wiring.test.ts`,
  frontend comments, API contracts, `/api/engines`, routes, navigation, replay baseline, engine
  source, calibration, expected outputs, golden references, validation fixtures, D7 governance,
  GovTip, A1 certificates, IVM, D42, production configuration.
- NOT a B1 certification claim; NOT an A1 transfer. NO execution exposure.
- PRODUCTION / RELEASE / PROMOTION / TAGGING: NOT GRANTED. NOT provider activation; NOT D115, Dhan,
  or NSE.
