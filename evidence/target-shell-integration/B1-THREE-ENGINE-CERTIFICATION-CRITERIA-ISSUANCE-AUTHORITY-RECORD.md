# B1 Three-Engine Certification — Certification Criteria & Issuance Authority Act

| Field | Value |
|---|---|
| **Decision ID** | `b1-three-engine-certification-criteria-issuance-2026-09-25-001` |
| Governing authority | RAMKI (Designating Authority / Maintainer) |
| Recording agent | Arena — recording only (G1). No execution, no verification, no issuance |
| Act type | RAMKI AUTHORITY ACT: certification criteria and issuance standard. It is neither implementation nor certification |
| Date (Asia/Calcutta) | 2026-09-25 |
| B1 repository / branch | `ramkivs/iips-production-market-data` @ `arena/01a0d33d-iips-production-market-data` |
| Parent (B1 tip at recording) | `b3cfbe194bba426077a97ab1293ec881b38801ec` (Gate C) |
| Current certification | `B1-CERT-IES016-IES017-IES020-2026-09-25-001` = **CONDITIONAL / QUALIFIED**. Unchanged by this act |
| Lineage | authority act `0e032c5` → Gate A `0fd1859` → supplement `8b45d9f` → Gate B `c6794de` → Gate C `b3cfbe1` → read-only qualification-gap reconciliation (not committed) → this act (G1) |
| Status of this act | Recorded at G1. The six RAMKI decisions in §C are confirmed. G2–G6 are **not** executed and **not** automatically opened |

---

## A. Decision ID

`b1-three-engine-certification-criteria-issuance-2026-09-25-001`

## B. Scope

- **Engines:** exactly IES-016 `sector.telecommunications`, IES-017 `sector.automobile` and IES-020 `sector.materials-metals`. IES-006…015 are out of scope and are not re-certified.
- **What this act defines:** the B1 certification criteria, the role standard and the issuance mechanism required to move from CONDITIONAL / QUALIFIED to an issued B1 certification.
- **What this act does not do:** it executes nothing; changes no product code, registry, API, header, test, pack, manifest or replay baseline; does not amend Gate C; and does not change the current determination.
- **External governance:** irr governance (`ramkivs/iips-review-recovered`, GovTip `524739093adb…`), namely D7, D15, D25 and the A1 records, is cited as historical precedent. Precedent binds B1 **only** where this act expressly adopts it (L-3 D15-style separation; L-4 DEC-D25 recognition; §E maintainer-issuance precedent).

## C. RAMKI decisions

### Decision 1 — L-1 Windows Tier-3 standard: **OPTION A — NEW B1-NATIVE WINDOWS TIER-3 EXECUTION**

1. **Pin.** B1 commit `b3cfbe194bba426077a97ab1293ec881b38801ec`, checked out detached. This act's G1 commit adds only this record, so the tested content is identical. Pre-checks at the pin:
   - engine trees: telecommunications `ff92542423f5751c992dc31961aedc9810651291`, automobile `dbdaa90e224b9297a330856f46abb6787790bdf7`, materials-metals `e3e13d5fc55e12947b27a2a50fe6f5baab994537`;
   - pack trees: `ies-016-telecommunications/` `33e4f3ac97428da6d257b7a308c9c56256350997`, `ies-017-automobile/` `a2de07ffeb9ddfd2eac84221f0a1a6fef42a88d9`, `ies-020-materials-metals/` `2b66ff12d81288d5ba0d25b2a4bcd166a178b58d`;
   - lockfiles (SHA-256): `package-lock.json` `307c47cbd36914e40e7bd6c939649a54febad40f65c80d5907812e850de2a8b9`; `iips-platform/package-lock.json` `20e626b90a3e89be58eb1df0b958b6c9a030dafdba39bcf684840db459a48a79` (pins tsx 4.23.9).
2. **Exactly these 12 files.** Each must match on bytes and SHA-256. These are the same values as the historical Tier-3 table; the Git blob is shown for reference.

   | # | `iips-platform/tests/regression/` | SHA-256 | Git blob |
   |---|---|---|---|
   | 1 | `telecommunications-acceptance.test.ts` | `2bf45b69cf58fd89c86cc8559bcb0801a37e2b2ca76acbe62808864d5de8ebf1` | `86cf4b3ff943` |
   | 2 | `telecommunications-framework-integration.test.ts` | `ded96a3929bfd583ab1099c28b28979c2a9a471432e920ea0b1951c9a07a3b61` | `e9950b5636c6` |
   | 3 | `telecommunications-reuse-verification.test.ts` | `d8ec7b9411b72dad08aea162eada516f6ea07dc6e61728748ea604bbd49852a1` | `ec70fc39c020` |
   | 4 | `telecommunications-wp4-validation.test.ts` | `60aa5d1e5c796bc7eaf4599d46000c5359f298e2591b8e646e1ebfa8042a4fc1` | `ac5521cd5e9f` |
   | 5 | `automobile-acceptance.test.ts` | `35d8f133beb6df7a90ee06bbd272d52ed8f3690c95acdb545b2dabcd79bb0a87` | `154dfad3f5e0` |
   | 6 | `automobile-framework-integration.test.ts` | `188b8a281609ee2bc3a7515c75773fb0b7dc8d8956527f93fd7b9aeebd2480a4` | `b9b4630b62be` |
   | 7 | `automobile-reuse-verification.test.ts` | `c52b2ad6cc7d75c0ffb389c3d3cbc4771774bf0d11416eec7fa663ad127b62bc` | `ffaf06243cf6` |
   | 8 | `automobile-wp4-validation.test.ts` | `b3f8e695e5103ed16e3ee63142edc56650dd893daf66e0f2e477e72954f2effc` | `c525a7dc8ef4` |
   | 9 | `materials-metals-acceptance.test.ts` | `705e459d4af95e943a2d06e4aadebf2b89401b9fc0f7ffe07ac0c1cd1a097757` | `74a6742c68a5` |
   | 10 | `materials-metals-framework-integration.test.ts` | `7cc13c1c178c33e715495d002c7fbec4ede493fe6fbb72467f4e8ecb85367bd9` | `a8542ae43dd3` |
   | 11 | `materials-metals-reuse-verification.test.ts` | `d360930970dbce9cd85bc67b40cb408a1060c3a974a3ebcddf0f5847e5857a14` | `927e475e5c22` |
   | 12 | `materials-metals-wp4-validation.test.ts` | `7daa7da3afbc6fe408ae15f63fc311ec6daff63977698bbd2ccc4f8a648307be` | `215253df4b49` |

3. **Expected starting state.** This is B1-native and differs from the historical `phase13-next` dirty-state protocol; the difference is disclosed.
   - Make a fresh clone with `git clone -c core.autocrlf=false https://github.com/ramkivs/iips-production-market-data.git <path>`, then `git checkout --detach b3cfbe194bba426077a97ab1293ec881b38801ec`. The 12 SHA-256 values are of LF bytes, and CRLF conversion voids the run.
   - Run `npm.cmd ci` in the repository root and in `iips-platform`. This is permitted, unlike the historical no-install rule; `node_modules/` and `dist/` are git-ignored.
   - After that: `git rev-parse HEAD` == pin; `git status --porcelain=v1 --untracked-files=all` is **empty**; `git config core.autocrlf` = `false`.
4. **Windows execution environment:**
   - Windows 10 or 11, x64;
   - Node.js ≥ 20 (22.x LTS recommended), with the exact version recorded;
   - `npm.cmd` present;
   - a dedicated path such as `G:\IIPS\B1-TIER3-CERT-<YYYYMMDD>`. It is **not** `G:\IIPS\phase13-next-authority` and **not** `G:\IIPS-F9-UI06-WINDOWS-ACCEPTANCE`;
   - only Windows-native tooling: `cmd.exe` or PowerShell, `certutil -hashfile <file> SHA256` or `Get-FileHash`, and `curl.exe`. No Unix-only syntax.
5. **Authorized command.** From `<path>\iips-platform`, run exactly:
   `npx.cmd --no-install tsx --test` followed by the 12 paths of item 2 (as `tests/regression/<file>`), in table order.
   - No globs, no `npm test`, no watch, no coverage, no extra flags.
   - stdout and stderr are redirected to an evidence folder **outside** the repository.
6. **Operator identity:** RAMKI, or a Windows operator designated by RAMKI, named in the evidence.
7. **Verifier identity:** per Decision 2, the role-separated verification agent (G4). The verifier does not execute.
8. **Machine identity:** hostname, OS edition and build, and CPU architecture, recorded in the evidence.
9. **Evidence and transcript requirements** (captured outside the repository):
   - working directory and exact command line;
   - the complete transcript (stdout, stderr and TAP output);
   - the process exit code;
   - `node --version`, `npm.cmd --version` and `npx.cmd --no-install tsx --version`;
   - UTC start and end timestamps;
   - operator identity and machine identity;
   - `git rev-parse HEAD` and `git status --porcelain=v1 --untracked-files=all`, before and after;
   - SHA-256 of the 12 test files and both lockfiles, before and after;
   - `SHA256SUMS.txt` over every evidence file.
10. **Required PASS criteria** (all):
    - 87 subtests, 87 pass, 0 fail, 0 cancelled, 0 skipped, 0 todo, exit code 0;
    - tsx 4.23.9 resolved;
    - the 12 test-file and 2 lockfile hashes unchanged before and after;
    - HEAD unchanged;
    - status empty before and after.

    Any hash difference **voids** the execution. Any other deviation is evidence requiring review, **not** an automatic pass or fail.
11. **How the result becomes B1 evidence:**
    - it is committed only by the G3 Evidence Recording Gate, byte-exact, with `SHA256SUMS.txt` verified;
    - it is verified under Decision 2 (G4);
    - it counts towards certification only through the G5 RAMKI Issuance Gate.
12. **Non-substitution.** The existing B1 Linux 87/87 (Gate C) is **not** substituted and remains reproduction evidence only. The historical `phase13-next` Tier-3 run is **never** B1 evidence. The historical D7 P1 script is **never** re-run; it is a distinct D7 architecture-review workstream, not this execution.

### L-2 — Windows/browser artifact (minimum authoritative recording artifact)

The artifact is required alongside Decision 1. It is captured outside the repository during G2, in the folder that becomes
`evidence/operator_drop/b1_three_engine_windows_certification_<YYYYMMDD>/`:

| File | Required content |
|---|---|
| `git-head-before.txt`, `git-head-after.txt` | Tested B1 commit (the pin) |
| `git-status-before.txt`, `git-status-after.txt` | Both empty |
| `environment.txt` | Local and UTC date/time, operator, machine identity, OS build, `node` / `npm.cmd` / `tsx` versions, clone path, `core.autocrlf=false` confirmation, browser name and version |
| `build.txt` | `npm.cmd run -s build:tsc` result; `vite build` result |
| `tier3-transcript.txt`, `tier3-hashes-before.txt`, `tier3-hashes-after.txt` | Decision 1 execution |
| `api-engines.txt` | Full output of `curl.exe -i http://127.0.0.1:8788/api/engines` (headers and body). The server is started with `npm.cmd run dev:research-sector` (loopback 127.0.0.1:8788) |
| `api-assertions.txt` | One line per check: HTTP **200**; exactly **13** engines in registry order; `X-IIPS-Certification: NONE CLAIMED`; `provenance.b1Certification: NONE CLAIMED`; 3 × `certificationLineage` = `historical A1 lineage / B1 adoption pending certification` |
| `execute-probes.txt` | For each of `sector.telecommunications`, `sector.automobile` and `sector.materials-metals`: `POST /api/engines/<id>/execute` with body `{}` → **405**; `GET` → **404** |
| `browser-result.txt` | `http://127.0.0.1:5173/research/engines` (`npm.cmd run dev`), each item PASS or FAIL: 13 engine rows; provenance line contains "13 engines · freshness FROZEN" and "(NOT B1-certified)"; nav "Engines" shown as `partial`; no execute control |
| `screenshots/*.png` | Optional |
| `SHA256SUMS.txt` | SHA-256 of every file above, plus the SHA-256 of any helper script. Helper scripts must be read-only and hash-pinned |

**Recording rules:**
- The artifact **must be committed to B1**, byte-exact, by the G3 Evidence Recording Gate under separate RAMKI recording authority.
- The operator delivers the files as chat attachments and states the `SHA256SUMS.txt` digest. G3 verifies it and commits the files unmodified.
- Facts the recording environment cannot observe are labelled `WINDOWS-OPERATOR-VERIFIED`, following the irr `WINDOWS-MAINTAINER-VERIFIED` precedent.
- No screenshot, log or transcript may be fabricated or reconstructed.

### Decision 2 — L-3 role standard: **OPTION A — D15-STYLE ROLE SEPARATION**

**Terminology (mandatory in every G2–G6 record):** **ROLE-SEPARATED, NOT ORGANIZATIONALLY INDEPENDENT.**

- **Operator / executor:** RAMKI, or the RAMKI-designated Windows operator. Executes G2; does not verify.
- **Verifier:** the role-separated verification agent (G4). Works only from the evidence committed at G3; executes nothing; authors no issuance; records a verification report. It is **not** described as independent.
- **Issuer:** RAMKI (G5).
- **Mandatory disclosure:** "The Arena agent prepared Gates A, B and C and records G1/G3. No organizational, external, third-party or accredited independence exists or is claimed."

### Decision 3 — L-4: **YES — B1 FORMALLY RECOGNIZES DEC-D25 / D17 v1.0 = ACCEPT**

- **What is recognized:** B1 formally recognizes DEC-D25 (`DEC-D25-TIER3-EVIDENTIARY-STANDARD`; irr `arena/01a03e3b-iips-review-recovered`, commit `3617ac5`, 2026-08-29), "IES-017 **D17 v1.0 = ACCEPT**", as the methodology-acceptance authority for IES-017 in B1.
- **Scope of D25 itself:** D25 records all three acceptances (D16, D17 and D20 v1.0) as fresh forward-looking acceptances, and states that historical acceptance is established for none. This decision recognizes only D17.
- **The self-label is preserved unchanged.** The frozen IES-017 historical self-label "IES-017 v1.0 (D17 normative) — PROPOSED, NOT AUTHORITY" is kept as a disclosed historical self-label in:
  - all 7 frozen pack locations: ontology metadata, calibration, golden reference, validation fixtures, expected outputs, replay dataset, and `contract-tests/generate_expected_outputs.py`;
  - the 4 engine-local copies under `iips-platform/src/sector-engines/automobile/`.
- **No edits.** No frozen pack file, freeze manifest or engine-local copy is edited.
- **Nature of the recognition:** it is **B1 governance adoption**. It is not a modification of the historical pack and not a transfer of A1 certification.

### Decision 4 — L-5: **YES — FRESH PER-ENGINE CLASSIFICATION OF THE CARRIED-FORWARD D7 QUALIFICATIONS**

- **D7 itself remains CLOSED and is not reopened.** D7's historical verdict (`D7-TIER3-PARITY = SATISFIED WITH RECORDED QUALIFICATIONS`) is unchanged.
- **Procedure:** the G4 verification report proposes, and the G5 issuance act records, a fresh classification for each engine based on B1 evidence.
- **Categories:**
  - **BLOCKING** — prevents issuance;
  - **NON-BLOCKING** — relevant to certification but satisfied or tolerable;
  - **OUTSIDE CERTIFICATION CRITERION** — not a B1 criterion; recorded as unresolved;
  - **NO EFFECT ON B1 EXECUTION** — proven by B1 evidence;
  - **PERMANENT DISCLOSURE** — cannot be resolved; carried indefinitely.
- **Items that require explicit treatment:** each of the following must be classified; none may be omitted. Proposed starting positions are non-binding; G4 and G5 decide.

  | Item | Engines | Proposed starting position (non-binding) |
  |---|---|---|
  | IES-017 stale-pack discrepancy (frozen 74.8/71.8 vs `AUTOMOBILE_DISCOVERY_PACK.md` 74.9/71.9) | 017 | NO EFFECT ON B1 EXECUTION + PERMANENT DISCLOSURE (still registered OPEN) |
  | DF-1 | 016/017/020 | NON-BLOCKING |
  | 33/33 manifest qualification | 016/017/020 | NON-BLOCKING |
  | Q5 | 016/017/020 | OUTSIDE CERTIFICATION CRITERION |
  | IES-020 §28 Q1, Q2, Q3, Q5 | 020 | OUTSIDE CERTIFICATION CRITERION |
  | IES-020 §28 Q4 | 020 | NON-BLOCKING |
  | D7 independence OPEN / NEGATIVE | 016/017/020 | PERMANENT DISCLOSURE |
  | D7 adjudicator non-independence | 016/017/020 | PERMANENT DISCLOSURE |
  | D7 adjudication report `2296764a3023bda223231dd02ef144661b0cd6dd7701c60132609e78f9df888a` unrecoverable | 016/017/020 | PERMANENT DISCLOSURE |

### Decision 5 — Issuance: **YES — FORMAL RAMKI MAINTAINER ISSUANCE ACT REQUIRED**

The historical A1 / DEC-D25 precedent is adopted: certification is a maintainer issuance act. It cannot be issued by an agent determination, a verification report or a recording gate. Details are in §E.

**Proposed final state (on issuance only): B1 CERTIFIED — WITH RECORDED PERMANENT QUALIFICATIONS.**

### Decision 6 — API: **KEEP GLOBAL `X-IIPS-Certification = NONE CLAIMED`**

- The global header is set on **every** response of the 8788 research/sector authority. That authority serves `/api/engines`, `/api/company/`, `/api/cross-sector`, `/api/decision-matrix`, `/api/evidence/`, `/api/replay/` and `/api/health`. It therefore **remains `NONE CLAIMED`**.
- Any later certification disclosure **must be per-engine**, within the `/api/engines` payload, for IES-016/017/020 only.
- That disclosure **requires a separate authorized G6 gate**.
- The API is not modified by this act.

## D. Certification standard

B1 certification of each of IES-016, IES-017 and IES-020 requires **all** of the following:

1. Gate C evidence items A–M, O and P still hold at the pin: engine identity; source, pack, freeze-manifest, calibration, golden, fixture, expected-output and replay identity; runtime binding; registry; WP4 15/15; regression 29/29 per engine; Track-3 replay 11/11; API disclosure; no Execute.
2. Decision 1: the Windows Tier-3 execution PASS, per its criteria.
3. The L-2 artifact committed through G3 and verified at G4.
4. Decision 2: role separation met and disclosed with the mandatory terminology.
5. Decision 3: DEC-D25 recognition recorded (this act).
6. Decision 4: fresh per-engine classification with **no item classified BLOCKING**.
7. Every permanent qualification in §F carried forward.

## E. Issuance authority

- **Issuer:** RAMKI (maintainer issuance act).
- **Required evidence package:**
  - this act;
  - the Gate C record and evidence JSON (`b3cfbe1`);
  - the G2 artifacts as committed at G3;
  - the G4 verification report, including the Decision 4 classifications;
  - integrity re-checks at issuance: pack trees, 36/36 manifest pins, the 12 test-file hashes and the engine trees unchanged.
- **Transition point:** the determination changes from **CONDITIONAL / QUALIFIED** only when the **G5 RAMKI Issuance Gate** is committed. It does not change at G1, G2, G3 or G4.
- **Resulting state:** **B1 CERTIFIED — WITH RECORDED PERMANENT QUALIFICATIONS**. An unqualified "CERTIFIED" is not available while any §F item stands.
- **Served API disclosure transition:**
  - it happens only at a separate **G6** gate, after G5;
  - it is per-engine for IES-016/017/020 in the `/api/engines` payload, referencing the certificate ID and "with recorded permanent qualifications";
  - the global `X-IIPS-Certification` stays `NONE CLAIMED` (Decision 6);
  - IES-006…015 and all other routes are unaffected;
  - until G6, the API continues to serve `NONE CLAIMED` and "historical A1 lineage / B1 adoption pending certification".
- **Separate gate required:** issuance requires its own separately authorized G5 gate.

## F. Permanent qualifications

These are preserved unless separately resolved by valid authority:

1. D7 independence OPEN / NEGATIVE.
2. D7 adjudicator non-independence.
3. D7 adjudication report `2296764a…` unrecoverable.
4. Q5 — OUTSIDE CERTIFICATION CRITERION.
5. IES-020 §28 Q1–Q3 and Q5 — OUTSIDE CERTIFICATION CRITERION.
6. IES-020 §28 Q4 — NON-BLOCKING.
7. The frozen IES-017 "PROPOSED, NOT AUTHORITY" historical self-label.
8. The IES-017 stale-pack discrepancy (frozen 74.8/71.8 vs pack text 74.9/71.9), still registered OPEN.
9. The historical `phase13-next` Tier-3 run (87/87 at `ff1c90e`) remains historical and is never B1 evidence.
10. The Linux 87/87 (Gate C) remains reproduction evidence only. It is not substituted (Decision 1 = Option A).
11. The 30/36 manifest CRLF rendering convention (30 pins match the CRLF rendering of LF-committed blobs; 6 match raw bytes).
12. The API remains `NONE CLAIMED` until a later authorized gate (G6); the global header stays `NONE CLAIMED` (Decision 6).
13. Role separation only: ROLE-SEPARATED, NOT ORGANIZATIONALLY INDEPENDENT (Decision 2).

## G. Required subsequent execution gates

Each requires separate RAMKI authorization. There is **no automatic progression**.

| Gate | Actor | Action | Writes to B1 |
|---|---|---|---|
| **G1** Authority Recording | Arena (recording only) | Record this act | This record only. **Completed by this commit** |
| **G2** Windows Operator Execution | Operator (RAMKI / designee) | Decision 1 execution and L-2 capture, outside the repository | None |
| **G3** Evidence Recording | Arena (recording only) | Commit the G2 artifacts byte-exact to `evidence/operator_drop/b1_three_engine_windows_certification_<YYYYMMDD>/`; verify `SHA256SUMS.txt` | Operator artifacts only |
| **G4** Verification | Role-separated verification agent | Verify G3 against §D; propose Decision 4 classifications; no execution | Verification report only |
| **G5** RAMKI Issuance | RAMKI (Arena records) | Issuance act and B1 certificate record | Issuance record only |
| **G6** API Disclosure Transition | Arena under separate authority | Per-engine disclosure per §E | Bounded registry, adapter and test change only |

## H. Explicit prohibitions

This act and G1–G5 do **not** authorize:
- modifying product code, the registry, the API, the global header, tests, engine source, packs, freeze manifests, calibration, golden or expected outputs, validation fixtures, or the replay baseline;
- enabling Execute or any `/api/engines/:id/execute` route;
- production, release, promotion, tagging or merging;
- reopening D7, changing D7's verdict, or re-running the historical D7 P1 script (`D7-TIER3-PARITY-P1-EXECUTION-Gate-v3.ps1`);
- modifying GovTip, `phase13-next`, the historical A1 certificates or the IVM;
- D115, NSE, Dhan or provider activation;
- transferring A1 certification, or representing historical A1 evidence as B1 certification;
- using the historical `phase13-next` Tier-3 run as B1 evidence;
- treating Linux evidence as Windows evidence;
- claiming independence that does not exist;
- fabricating any screenshot, log, transcript or evidence;
- using `G:\IIPS-F9-UI06-WINDOWS-ACCEPTANCE`, or writing operator artifacts inside the repository during G2;
- amending Gate C or any historical authority record;
- amending or force-pushing.

## I. Recording determination (G1)

- **Recorded:** AUTHORITY ACT RECORDED (G1). The six RAMKI decisions are confirmed.
- **Not changed:** no product mutation; no certification promotion. `B1-CERT-IES016-IES017-IES020-2026-09-25-001` remains **CONDITIONAL / QUALIFIED**.
- **Not executed:** no Windows execution; G2 is not executed.
- **Next authorized gate:** G2 — Windows Operator Execution. It requires separate RAMKI authorization.

**Process disclosure:** before recording, the sandbox had restored the local branch ref to the stale `da43051`. The worktree was proven byte-identical to the remote tip `b3cfbe1` through a temporary index (0 modified, 0 untracked). The local ref was then re-pointed to `b3cfbe1`; this was local only, with no reset, rebase, amend or force-push.
