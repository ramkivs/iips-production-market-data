# Institutional Investment Platform System (IIPS)
# B1 Three-Engine A1 Adoption — GATE A SUPPLEMENT: Pack-Path Completion — Execution & Provenance Addendum

**Executes:** `b1-three-engine-a1-adoption-2026-09-25-001-A1-gate-a-supplement`
(authority amendment `evidence/target-shell-integration/GATE-A-SUPPLEMENT-PACK-PATH-COMPLETION-AUTHORITY-AMENDMENT.md`,
commit `edf9a93eeddb3557ddcadcc871bd5f017598473e`)
**Parent B1 SHA (pre-execution HEAD = authority commit):** `edf9a93eeddb3557ddcadcc871bd5f017598473e`
**Recording Agent:** Arena (supplement execution + provenance recording)
**Recorded At (local, Asia/Calcutta):** 2026-09-25
**Relationship to Gate A record:** separate addendum. `GATE-A-THREE-ENGINE-ASSET-PACK-PROVENANCE.md` and its JSON
companion are NOT edited. Per the amendment §5, their statement that the canonical pack paths are
"intentionally absent" (and the JSON disposition "UNTOUCHED — not duplicated", as it describes the pack paths)
is superseded by this execution for the 12 objects below only. The existing B1 objects remain untouched.

---

## 1. Pre-mutation checks (all passed; any failure would have thrown with no write)

| # | Check | Result |
|---|---|---|
| 1 | HEAD == authority commit `edf9a93` | PASS |
| 2 | LOCAL == REMOTE (`edf9a93`) | PASS |
| 3 | Worktree clean | PASS |
| 4 | Authority amendment present; sole file of the authority commit | PASS |
| 5 | All 12 canonical target paths absent (commit and disk) | 12 / 12 |
| 6 | All 12 existing B1 source objects present | 12 / 12 |
| 7 | Source blob == authorized 40-char blob (index and raw on-disk bytes) | 12 / 12 |
| 8 | No target path ignored | 12 / 12 |
| 9 | No normalization differences (no CR bytes; filtered hash == unfiltered hash) | 12 / 12 |
| 10 | Nothing staged before mutation | PASS |

## 2. Method

Source = the already-existing B1 objects under `iips-platform/src/sector-engines/<sector>/` only (no other byte
source). For each: exact bytes read from the B1 object store by the authorized blob ID; written to the canonical
pack path; asserted destination blob (`git hash-object --no-filters`) == authorized blob; asserted destination
bytes == existing B1 source file bytes (`cmp`); staged by blob ID for that path only. No JSON edit, no line-ending
normalization, no change to any existing object.

## 3. Blob identity matrix (12 / 12)

| # | Added canonical pack path | Existing B1 source (unchanged) | Blob (source = destination = authorized) |
|---|---|---|---|
| 1 | `ies-016-telecommunications/fixtures/telecommunications-golden-reference-1.0.0.json` | `iips-platform/src/sector-engines/telecommunications/telecommunications-golden-reference-1.0.0.json` | `f0dfc647b8e0220d04a241902a82899e3a667393` |
| 2 | `ies-016-telecommunications/fixtures/telecommunications-validation-fixtures-1.0.0.json` | `iips-platform/src/sector-engines/telecommunications/telecommunications-validation-fixtures-1.0.0.json` | `25accdd952a6f774968e51b3a18eb6f4aa1dbf05` |
| 3 | `ies-016-telecommunications/expected-outputs/telecommunications-expected-outputs-1.0.0.json` | `iips-platform/src/sector-engines/telecommunications/telecommunications-expected-outputs-1.0.0.json` | `0d45ffc44df6d61a6f95dac15a12cb6f88be3155` |
| 4 | `ies-016-telecommunications/calibration/telecommunications-calibration-1.0.0.json` | `iips-platform/src/sector-engines/telecommunications/telecommunications-calibration-1.0.0.json` | `178160fcbe0a30975c6796ac22c73a9bd03ab91a` |
| 5 | `ies-017-automobile/fixtures/automobile-golden-reference-1.0.0.json` | `iips-platform/src/sector-engines/automobile/automobile-golden-reference-1.0.0.json` | `11dcd3953046c4e27f80a8ffc71c2c7ef59ede47` |
| 6 | `ies-017-automobile/fixtures/automobile-validation-fixtures-1.0.0.json` | `iips-platform/src/sector-engines/automobile/automobile-validation-fixtures-1.0.0.json` | `fa9bb6df3560bd2449486d5ac9dbc889ff7ac56d` |
| 7 | `ies-017-automobile/expected-outputs/automobile-expected-outputs-1.0.0.json` | `iips-platform/src/sector-engines/automobile/automobile-expected-outputs-1.0.0.json` | `b9982d744d92d592714dcc5b1e8599bed63752f2` |
| 8 | `ies-017-automobile/calibration/automobile-calibration-1.0.0.json` | `iips-platform/src/sector-engines/automobile/automobile-calibration-1.0.0.json` | `e3f84ede6f5e89580aa451a689c0b5689cf8674e` |
| 9 | `ies-020-materials-metals/fixtures/materials-metals-golden-reference-1.0.0.json` | `iips-platform/src/sector-engines/materials-metals/materials-metals-golden-reference-1.0.0.json` | `1b601093cb09d607a7725bfed6b7cc4689c3f1e0` |
| 10 | `ies-020-materials-metals/fixtures/materials-metals-validation-fixtures-1.0.0.json` | `iips-platform/src/sector-engines/materials-metals/materials-metals-validation-fixtures-1.0.0.json` | `000412669a40a7b36e6bdd85bcbb9196dd5ab2e4` |
| 11 | `ies-020-materials-metals/expected-outputs/materials-metals-expected-outputs-1.0.0.json` | `iips-platform/src/sector-engines/materials-metals/materials-metals-expected-outputs-1.0.0.json` | `3e67cb6f01fdc7a2459d6f4376e54cfa4b89cf2e` |
| 12 | `ies-020-materials-metals/calibration/materials-metals-calibration-1.0.0.json` | `iips-platform/src/sector-engines/materials-metals/materials-metals-calibration-1.0.0.json` | `ceea1d5fe7c9e4c56f76f6d34efcbbfef311cccf` |

Mode `100644` for all. Each blob also equals the certified source object at irr `phase13-next`
`c2dda91de8bd362d4766ed19d777a80e6976c9b5`.

## 4. Post-mutation acceptance (verified before commit)

| Condition | Result |
|---|---|
| A. Source / destination / authorized blob identity | **12 / 12** |
| B. Freeze-manifest `documentHashes` pins, each under its manifest's own `hashNormalization` rule — now all verified against files inside the pack itself | **36 / 36** (12 per engine) |
| C. `ies-016-telecommunications` tree | `33e4f3ac97428da6d257b7a308c9c56256350997` — MATCH (= certified source at `c2dda91`) |
| C. `ies-017-automobile` tree | `a2de07ffeb9ddfd2eac84221f0a1a6fef42a88d9` — MATCH |
| C. `ies-020-materials-metals` tree | `2b66ff12d81288d5ba0d25b2a4bcd166a178b58d` — MATCH |
| D. Certified 34-file layout | 34 / 34 files per pack; 0 differences vs certified tree listing |
| E. Existing B1 source objects unchanged | 12 / 12 |
| F / G. Test, registry, API, replay-baseline, manifest, engine-source, frontend changes | NONE (staged set = the 12 pack files only, all additions) |
| H. D7 / GovTip / A1 / IVM | Unchanged (irr GovTip `524739093adb…`, `phase13-next` `1a602d849cc4…` verified by `ls-remote`; nothing written to irr) |

Gate A qualification **Q-A2** (recovered pack directories 30/34, trees unequal) is **closed**: B1 pack trees now
equal the certified source pack trees. Gate A qualification **Q-A1** (12 pre-existing WP4 failures) is
**resolved**: see §5.

## 5. Tests (existing tests, unmodified)

| Suite | Before supplement (Gate A record) | After supplement |
|---|---|---|
| Three-engine WP4 (`IES016/017/020-WP4-ACC1…ACC5`) | 3 pass / 12 fail | **15 / 15 PASS** |
| Exact Tier-3 12-file command (verbatim text from `DEC-A2-A1-TIER3-TEST-EXECUTION-AUTHORITY` §4, irr `3dbc5bc`, blob `86f36108c4d9070f7446a35ebf102005602496e5`), run from `iips-platform/` | not reproducible (WP4 failing) | **87 / 87 PASS**, exit 0 |
| Root suite `dist/tests/*.test.js` | 768 / 768 | **768 / 768 PASS** |

The twelve Tier-3 test files match the authority's pinned byte sizes and SHA-256 values 12 / 12. Resolved runtime:
`tsx v4.23.9` (the authority's expected version), Node.js `v22.22.3`.

### Tier-3 reproduction limitation (recorded explicitly)

The command text and the twelve pinned files are identical, but the authorized Tier-3 **execution environment is
not reproduced**: that authority pins repository root `G:\IIPS\phase13-next-authority` (Windows), branch
`phase13-next` at HEAD `ff1c90e48f65c6ca22e0f87d9d0ebfd3c927ca36`, an exact ten-entry dirty pre-state, and
pre-existing `node_modules` with installation prohibited. This run was in B1 (`arena/01a0d33d-…`, parent
`edf9a93`) on Linux, with dependencies installed by `npm ci` from the committed lockfiles (git-ignored) because the
sandbox had been reset, followed by `npx --no-install`. This 87 / 87 is **B1 reproduction evidence only**. It is
NOT the authorized Tier-3 execution, NOT certification, and NOT an A1 transfer.

## 6. Carried qualifications (unchanged)

D7 independence OPEN / NEGATIVE; adjudication source artifact (SHA-256 `2296764a…`, 13,755 bytes) unrecoverable;
Q5 OUTSIDE CERTIFICATION CRITERION; DF-1 NON-BLOCKING (byte identity not claimed); 33/33 manifest qualification
NON-BLOCKING; IES-020 §28 Q1/Q2/Q3/Q5 OUTSIDE, Q4 NON-BLOCKING; IES-017 stale-pack registered OPEN (the pack
values `74.9` / `71.9` remain unchanged); adjudicator non-independence. Observation (outside scope, no action):
B1 lacks the standards delivery units for IES-010…015 and cross-sector.

## 7. Explicit Non-Effects

- GATE B = CLOSED. GATE C = CLOSED. Registry remains 10 engines (IES-006…015).
- NOT modified: tests, `EngineRegistry.ts`, `EngineApiAdapter.ts`, API, `/api/engines`, frontend, routes,
  navigation, replay baseline, engine source, freeze manifests, existing calibration / expected outputs / golden
  references / validation fixtures, D7 governance, GovTip, A1 certificates, IVM, D42, production configuration.
- NOT a B1 certification claim; NOT an A1 transfer; NO execution exposure.
- PRODUCTION / RELEASE / PROMOTION / TAGGING: NOT GRANTED.
- Commit content: the 12 authorized pack files + this addendum only.
