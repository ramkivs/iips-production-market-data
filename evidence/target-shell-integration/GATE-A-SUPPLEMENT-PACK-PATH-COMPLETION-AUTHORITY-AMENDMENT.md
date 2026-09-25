# Institutional Investment Platform System (IIPS)
# B1 Three-Engine A1 Adoption — GATE A SUPPLEMENT: Pack-Path Completion — Ramki Authority Amendment

**Decision ID:** `b1-three-engine-a1-adoption-2026-09-25-001-A1-gate-a-supplement`
**Decision type:** RAMKI AUTHORITY AMENDMENT
**Purpose:** GATE A SUPPLEMENT — PACK-PATH COMPLETION
**Governing Authority:** RAMKI (Designating Authority)
**Recording Agent:** Arena (recording only — no asset mutation, no implementation)
**Recorded At (local, Asia/Calcutta):** 2026-09-25
**Amends:** `b1-three-engine-a1-adoption-2026-09-25-001` (authority record
`evidence/target-shell-integration/B1-THREE-ENGINE-A1-ADOPTION-AUTHORITY-RECORD.md`, blob
`6a6e826de26072c89a9cfa09677016f4f35f43c3`, commit `0e032c5e6002139fffdb0b4d7acbdca317c9853c`)
**Parent B1 SHA (Gate A completion):** `0fd185940b328d8c1977d9ad838ee47e3a1f5624`
**Antecedent:** Q-A1 Resolution Preflight (read-only) — Q-A1 TECHNICALLY RESOLVED; authority
determination REQUIRES RAMKI AMENDMENT.

---

## 1. Scope

IES-016 Telecommunications, IES-017 Automobile, IES-020 Materials & Metals only.

## 2. Authorized Mutation (when the supplement is separately executed)

Add exactly **12** byte-identical files at their canonical repository-root pack paths. The additions
are **COPIES of already-existing B1 objects** (and are identical to the certified source objects at
irr `phase13-next` `c2dda91de8bd362d4766ed19d777a80e6976c9b5`). Nothing else is authorized.

| # | Canonical pack path (to be added) | Blob | Class | Existing B1 object (unchanged) |
|---|---|---|---|---|
| 1 | `ies-016-telecommunications/fixtures/telecommunications-golden-reference-1.0.0.json` | `f0dfc647b8e0220d04a241902a82899e3a667393` | fixture | `iips-platform/src/sector-engines/telecommunications/telecommunications-golden-reference-1.0.0.json` |
| 2 | `ies-016-telecommunications/fixtures/telecommunications-validation-fixtures-1.0.0.json` | `25accdd952a6f774968e51b3a18eb6f4aa1dbf05` | fixture | `iips-platform/src/sector-engines/telecommunications/telecommunications-validation-fixtures-1.0.0.json` |
| 3 | `ies-016-telecommunications/expected-outputs/telecommunications-expected-outputs-1.0.0.json` | `0d45ffc44df6d61a6f95dac15a12cb6f88be3155` | expected-output | `iips-platform/src/sector-engines/telecommunications/telecommunications-expected-outputs-1.0.0.json` |
| 4 | `ies-016-telecommunications/calibration/telecommunications-calibration-1.0.0.json` | `178160fcbe0a30975c6796ac22c73a9bd03ab91a` | calibration | `iips-platform/src/sector-engines/telecommunications/telecommunications-calibration-1.0.0.json` |
| 5 | `ies-017-automobile/fixtures/automobile-golden-reference-1.0.0.json` | `11dcd3953046c4e27f80a8ffc71c2c7ef59ede47` | fixture | `iips-platform/src/sector-engines/automobile/automobile-golden-reference-1.0.0.json` |
| 6 | `ies-017-automobile/fixtures/automobile-validation-fixtures-1.0.0.json` | `fa9bb6df3560bd2449486d5ac9dbc889ff7ac56d` | fixture | `iips-platform/src/sector-engines/automobile/automobile-validation-fixtures-1.0.0.json` |
| 7 | `ies-017-automobile/expected-outputs/automobile-expected-outputs-1.0.0.json` | `b9982d744d92d592714dcc5b1e8599bed63752f2` | expected-output | `iips-platform/src/sector-engines/automobile/automobile-expected-outputs-1.0.0.json` |
| 8 | `ies-017-automobile/calibration/automobile-calibration-1.0.0.json` | `e3f84ede6f5e89580aa451a689c0b5689cf8674e` | calibration | `iips-platform/src/sector-engines/automobile/automobile-calibration-1.0.0.json` |
| 9 | `ies-020-materials-metals/fixtures/materials-metals-golden-reference-1.0.0.json` | `1b601093cb09d607a7725bfed6b7cc4689c3f1e0` | fixture | `iips-platform/src/sector-engines/materials-metals/materials-metals-golden-reference-1.0.0.json` |
| 10 | `ies-020-materials-metals/fixtures/materials-metals-validation-fixtures-1.0.0.json` | `000412669a40a7b36e6bdd85bcbb9196dd5ab2e4` | fixture | `iips-platform/src/sector-engines/materials-metals/materials-metals-validation-fixtures-1.0.0.json` |
| 11 | `ies-020-materials-metals/expected-outputs/materials-metals-expected-outputs-1.0.0.json` | `3e67cb6f01fdc7a2459d6f4376e54cfa4b89cf2e` | expected-output | `iips-platform/src/sector-engines/materials-metals/materials-metals-expected-outputs-1.0.0.json` |
| 12 | `ies-020-materials-metals/calibration/materials-metals-calibration-1.0.0.json` | `ceea1d5fe7c9e4c56f76f6d34efcbbfef311cccf` | calibration | `iips-platform/src/sector-engines/materials-metals/materials-metals-calibration-1.0.0.json` |

Composition: 6 fixture files · 3 expected-output files · 3 calibration files (4 per engine).

No existing B1 object may be modified, replaced, normalized, deleted, renamed, or duplicated at its
existing path.

## 3. Preflight Verification at Parent `0fd1859` (recorded before this amendment)

| Invariant | Result |
|---|---|
| All 12 canonical pack paths absent (commit and disk) | 12 / 12 |
| All 12 existing B1 objects present under `iips-platform/src/sector-engines/<sector>/` | 12 / 12 |
| Existing B1 blob = certified source blob (`c2dda91`) = listed target blob | 12 / 12 |
| Composition 6 fixture / 3 expected-output / 3 calibration; 12 distinct paths | CONFIRMED |
| After the 12 additions: certified source-pack objects still missing / B1 pack objects not in source | 0 / 0 per engine |
| Required modification to any test, engine source, freeze manifest, registry, API, replay baseline, or existing B1 asset | NONE (Q-A1 preflight; scratch evidence only) |

## 4. Required Acceptance Conditions (for the eventual execution)

- 12 / 12 source/destination blob identities equal;
- 36 / 36 freeze-manifest `documentHashes` pins remain valid;
- each pack tree equals its certified source tree:
  `ies-016-telecommunications` = `33e4f3ac97428da6d257b7a308c9c56256350997`,
  `ies-017-automobile` = `a2de07ffeb9ddfd2eac84221f0a1a6fef42a88d9`,
  `ies-020-materials-metals` = `2b66ff12d81288d5ba0d25b2a4bcd166a178b58d`;
- each pack becomes the certified 34-file layout;
- WP4 (IES016/017/020-WP4-ACC1…ACC5) = 15 / 15;
- exact Tier-3 12-file command (per `DEC-A2-A1-TIER3-TEST-EXECUTION-AUTHORITY`, irr `3dbc5bc`) = 87 / 87;
- root suite remains 768 / 768;
- no existing B1 object changes; no tests change; no registry change; no API change; no
  replay-baseline change; no D7 / GovTip / A1 / IVM change.

Any unmet condition means the supplement is NOT COMPLETE and must stop without workaround. A passing
87 / 87 in the B1 environment is reproduction evidence only; it is not certification.

## 5. Bounded Supersession

This amendment supersedes **only** the Gate A statement that the canonical pack-path copies were
intentionally absent, namely in `evidence/target-shell-integration/GATE-A-THREE-ENGINE-ASSET-PACK-PROVENANCE.md`
(blob `545c29bbf1fe582525ba077077fd445d61b1bea1`, commit `0fd185940b328d8c1977d9ad838ee47e3a1f5624`),
§5: *"Their pack paths are intentionally absent in B1."* — and the corresponding JSON disposition
`"UNTOUCHED — not duplicated"` for the same 12 objects — insofar as they describe the pack paths.
The existing B1 objects themselves remain untouched, as stated there.

The historical Gate A evidence record and its JSON companion are **not edited**. Upon execution, the
supplement records its result in a separate addendum. Everything else in the Gate A record, and in
`b1-three-engine-a1-adoption-2026-09-25-001`, remains in force.

## 6. Not Authorized by this Amendment

- opening Gate B; `EngineRegistry` 10→13; `EngineApiAdapter` changes; API changes; test re-pinning;
  frontend changes;
- certification of any kind; transfer of A1 certification;
- any change to D7 or governance HEAD (GovTip);
- production, promotion, release, or tagging;
- any file beyond the 12 listed in §2.

## 7. Standing

- GATE A SUPPLEMENT: authority prepared; execution requires a separate explicit opening.
- GATE B REMAINS CLOSED. GATE C REMAINS CLOSED. Registry remains 10 engines (IES-006…015).
- D7 qualifications carried forward unchanged: independence OPEN / NEGATIVE; adjudication source
  artifact unrecoverable; Q5; DF-1; 33/33 manifest qualification; IES-020 §28; IES-017 stale-pack
  OPEN; adjudicator non-independence.
- Observation (outside scope, no action): B1 also lacks the standards delivery units for IES-010…015
  and cross-sector, so their WP4 tests fail in B1 independently of this supplement.
- This file is the sole change in its commit. NO PACK FILES ADDED.
