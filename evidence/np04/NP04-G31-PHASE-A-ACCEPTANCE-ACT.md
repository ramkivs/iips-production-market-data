# NP04 — PHASE-A INDEPENDENT ACCEPTANCE ACT

**Act identifier:** `np04-g31-phase-a-acceptance-2026-10-01-001`
**Authority:** RAMKI (Program Authority) — instruction "NP04-G31 — Independent Phase-A Acceptance / Promotion Decision" (2026-10-01)
**Recording Agent:** Arena (recording only — no implementation, no qualification re-execution, no promotion)
**Scope:** NP04 — IPD durable user-portfolio persistence foundation (Phase A, adopted lineage)
**Nature:** INDEPENDENT ACCEPTANCE (governance/evidence artifact only)
**Governing Standards:** AD-01..AD-18 / AD-CHARTER-2026-01
**Execution Mode:** NON_PRODUCTION
**Recorded At (local, Asia/Calcutta):** 2026-10-01
**Repository:** `ramkivs/iips-production-market-data` (IPD — authoritative)
**Recording branch (this record):** `arena/01a0f839-iips-production-market-data`

---

## 1. PURPOSE AND CHARACTER OF THIS ACT

This act records the **independent acceptance decision** for the already-qualified NP04 Phase-A
implementation. It is separate from authority (G29), qualification (G30), and promotion
(not granted here).

This act does **not**: modify any implementation, test, dependency, migration, or protected
surface; re-run or replace qualification evidence; promote anything; advance `main`; recreate
`2f5613e`; validate G25/G26; or authorise any GATE-P application-domain work.

---

## 2. REFERENCED AUTHORITY (EXTERNALLY LOCATED, DELIBERATELY NOT COPIED)

| Element | Exact value |
| --- | --- |
| Authority act | `np04-g29-fresh-authority-phase-a-adoption-2026-10-01-001` |
| Authority record path | `evidence/np04/NP04-G29-FRESH-AUTHORITY-PHASE-A-ADOPTION-ACT.md` |
| Authority record ref | `refs/heads/arena/01a0f839-iips-production-market-data` |
| Authority record commit | `f4ceecb192f1d2e4ec7f67b6ac6615e71871eac8` |
| Authority record blob | `111a380a714d3beece90bef3040e9d381039a7bf` (14,218 bytes) |
| Retrievability (re-verified in G31) | **VERIFIED** — fetched independently from the remote; retrieved body hash-object equals the recorded blob exactly |
| Content adequacy | The record names this exact baseline, implementation candidate, corrective commit and continuation tip; it authorises adoption/revalidation and defines the authorised scope |

**Evidence-location separation is deliberate.** The authority record lives on the governance
branch; the implementation lineage lives on `arena/01a0f308-…`. G31 did **not** cherry-pick,
copy, or merge the authority record into the implementation lineage. This record references it
by immutable commit SHA, blob SHA and ref; no content is duplicated.

---

## 3. QUALIFIED ARTEFACT (G30 ANCHOR — RE-VERIFIED IN G31, UNCHANGED)

| Element | Exact value |
| --- | --- |
| Authoritative baseline | `0dab1221fb0f89e2e0601ea905d642bfe72d5f9c` |
| Implementation candidate | `8c9962725666be76ad58f52fd493a52479d0b75e` |
| Migration / audit correction | `d4fdb33d9810b0736a9a382d6ab35b7ce2a7480e` |
| Qualified continuation tip | `6828155ec6e882bbb4cabcd96b5a841d8c8a6bc4` |
| Qualified tree | `eb07ea36059c6e2d3f1b6ff9afb8e3fb0c562cc5` |
| Qualified branch | `arena/01a0f308-iips-production-market-data` (remote tip — **unchanged**; no commit after `6828155`) |
| Parentage | `6828155` ← `d4fdb33` ← `8c99627` ← `0dab1221` (single-parent chain, verified) |
| Competes elsewhere | **NO** — `src/persistence` exists on exactly one remote head |
| In-lineage governance | `evidence/np04/NP04-GOVERNANCE-AUTHORITY-RECORD.md` (blob `45d016e8d0443994dd356625113c4be6ebfda50c`) |

Because the qualified **root tree hash is unchanged**, the entire content of the qualified
artefact is unchanged since G30 — including all protected surfaces by construction.

---

## 4. QUALIFICATION EVIDENCE SOURCE (G30 — NOT RE-EXECUTED, NOT REPLACED)

Qualification was established by the read-only gate **NP04-G30 — Independent Phase-A
Requalification** (disposition **A — PHASE-A CURRENTLY QUALIFIED**). G31 did not re-run the
suite; §3 above establishes that the qualified artefact is byte-identical to what G30 qualified.

| Qualification result | Value |
| --- | --- |
| Phase-A (G24) suite | **84 passed / 0 failed / 0 skipped** — A10 B10 C13 D13 E9 F15 G4 H10 |
| Full regression suite | **782 passed / 0 failed / 0 skipped** (3 consecutive runs) |
| Baseline suite (`0dab1221`) | **698 passed / 0 failed** (exactly `782 − 84`; 9 test files added, 0 modified, 0 removed) |
| Repeatability | 3× full suite, 3× Phase-A suite, deterministic independent probes — **repeatable** |
| Typecheck (`tsc`) | 4 errors, **all pre-existing** — identical 4 at baseline `0dab1221`: `wsi_iu1_pit_series_aware_keying` ×1, `wsj_iu3_pit_read_boundary` ×3; **0 NP04-attributable**, 0 in NP04 files |
| Build | `npm run build:tsc` exit 2 blocked solely by those pre-existing errors; `npm run build:vite` exit 0 (`dist-frontend/`, 416 ms) |
| Protected surfaces | **0 changed files** across 13 protected prefixes (byte-level, baseline→tip) |
| Whole-tree delta | 42 files, +8,220 insertions, 0 deletions; only `package.json` + `package-lock.json` modified |
| Migration integrity | Ledger ordered `001,002`; SHA-256 checksums match immutable SQL; tamper → startup refused; future/unknown ledger row → refused, **no downgrade** |
| Lifecycle | validate → connect → migrate → verify; pragmas verified by read-back (FK=1, synchronous=FULL, rollback journal, busy_timeout 5000); schema version `002` |
| Fail-closed | invalid/missing/relative/root path and out-of-range timeout → `PERSISTENCE_CONFIGURATION_INVALID`; genuinely unopenable paths → `PERSISTENCE_UNAVAILABLE` with **no artefact created and no handle returned**; operations after close → `PERSISTENCE_CLOSED`; failed transaction fully rolled back |
| No in-memory fallback | Confirmed in product source and by test (`g24_g` G3) |
| Tenant isolation + ownership tuple | `applicationUserId + tenantId + portfolioId` enforced; cross-tenant/absent/revoked membership refused; schema PK/CHECK/FK verified |
| Independent probe integrity | G30 independent smoke run: 36 checks — 34 direct passes; the 2 initial non-passes were **probe-assumption errors, re-characterised, not suppressed** (see §5), followed by a corrected fail-closed probe **7/7 pass** |

**Qualification environment (bound to the result):** linux x64, 2 vCPU / 3.9 GB; Node **v22.22.3**;
npm 10.9.8; TypeScript 5.9.3; g++ 12.2 / Python 3.11.2; `better-sqlite3@13.0.3` via bundled
linux-x64 prebuild (SQLite runtime **3.53.4**); `npm ci --nodedir=/usr/local` because
`nodejs.org` is unreachable in the execution sandbox; lockfile dependency set installed exactly
with **no dependency, package.json or lockfile change**.

---

## 5. ACCEPTANCE-CRITICAL OBSERVATION — DATABASE DIRECTORY CREATION

**Observed behaviour.** `PersistenceConnection.open()` creates the parent directory of the
configured database path when it does not exist
(`fs.mkdirSync(directory, { recursive: true })`, `src/persistence/connection.ts`, blob
`49c867252e89720f98f3a5e6cd3ec7a059cca4e1`).

**Finding: A — WITHIN AUTHORISED PHASE-A SEMANTICS; ACCEPTED AS-IS, WITH THIS OBSERVATION
RECORDED.** Basis:

1. The behaviour is **documented at the implementation boundary**: the contract comment states
   “Opens (or creates) the SQLite database and applies the accepted pragmas.”
2. It remains within the authorised configuration boundary: the path is **only ever** the
   absolute path supplied through `IPD_PORTFOLIO_DB_PATH` (`src/persistence/config.ts`, blob
   `02090c191e8dd6e826106bdbe94cf65fedabaa72`). The implementation never invents, defaults, or
   falls back to another location; materialising the configured absolute path is consistent with
   the authorised scope item “configuration exclusively through `IPD_PORTFOLIO_DB_PATH`” and with
   the recorded Phase-A base case “initialization creates the database file” (`g24_a` A1).
3. Failure to create the directory **fails closed** as `PERSISTENCE_UNAVAILABLE` (“Unable to
   create database directory for …”), and no artefact is left behind (independently reproduced
   in G30: parent path occupied by a file → `ENOTDIR`, and read-only parent directory →
   `SQLITE_CANTOPEN`, both refused with no artefact created).
4. No authority text contradicts the behaviour; the G29 record contains no directory-creation
   restriction, and no governance artefact in the qualified lineage addresses it.

**Recorded caveat (not a defect, not a remediation item):** because the directory is created on
demand and the path must be absolute, operators must treat the configured parent path as
IPD-owned state. No remediation is required or authorised by this act.

*Transparency of G30 probe history:* two G30 probe checks initially reported non-pass because the
probe assumed a missing parent directory would fail. That assumption was incorrect; the probe was
corrected and re-run against genuinely unopenable paths, passing 7/7. The initial non-passes are
re-characterised here, not suppressed.

---

## 6. SCOPE COMPLETENESS

**Accepted scope (exactly the G29 authorised scope):**

1. durable IPD user-portfolio domain;
2. SQLite persistence substrate;
3. exact `better-sqlite3@13.0.3`;
4. `@types/better-sqlite3@9.6.0`;
5. configuration exclusively via `IPD_PORTFOLIO_DB_PATH`;
6. lifecycle validate → connect → migrate → verify → listen;
7. fail-closed database errors;
8. no in-memory persistence fallback;
9. tenant-membership persistence foundation as already represented;
10. `applicationUserId + tenantId + portfolioId` authorisation binding;
11. additive `/api/ipd` boundary;
12. migration infrastructure only insofar as already present in the adopted lineage;
13. project-level `engines` field **not** present and **not** required.

**Explicitly excluded (verified absent in the qualified artefact):** Watchlists; Reports;
Collaboration; Settings; Governed Screener persistence; tenant administration, provisioning,
revocation, lifecycle restoration (`REVOKED → ACTIVE`), delegation, self-service; tenant
membership audit expansion and cross-system security-audit delivery; unrelated production
functionality; any protected-foundation modification. Verified in G30: no GATE-P
application-domain persistence exists in `src/`; no tenant-administration HTTP surface exists.

---

## 7. ACCEPTANCE CRITERIA EVALUATION

| Criterion | Evaluated result | Basis |
| --- | --- | --- |
| Fresh G29 authority exists | **PASS** | §2 |
| Authority is durable | **PASS** | pushed commit `f4ceecb`; blob verified by independent retrieval (§2) |
| Exact qualified lineage identified | **PASS** | §3 |
| Independent G30 qualification exists | **PASS** | §4 |
| Qualification evidence reproducible | **PASS** | 3× runs across two suites; deterministic probes |
| Protected foundations intact | **PASS** | 0 changed across 13 prefixes; qualified tree unchanged |
| Authorised dependencies exact | **PASS** | `better-sqlite3@13.0.3`, `@types/better-sqlite3@9.6.0`; no `engines`; no drift |
| No unauthorised scope | **PASS** | §6 |
| Known directory-creation behaviour characterised | **RESOLVED** | §5 — accepted as-is with recorded observation |
| Acceptance evidence can be durably referenced | **RESOLVED** | §2 (authority) and this record (§8–§9) |
| No unresolved acceptance-critical defect | **PASS** | no defect identified; no `TODO/FIXME/XXX/HACK` markers in NP04 source; pre-existing tsc errors proven non-NP04 |

No numerical score is assigned.

---

## 8. ACCEPTANCE DECISION

```text
NP04 PHASE-A — INDEPENDENT ACCEPTANCE = ACCEPTED
```

**Accepted artefact:** `6828155ec6e882bbb4cabcd96b5a841d8c8a6bc4` (tree
`eb07ea36059c6e2d3f1b6ff9afb8e3fb0c562cc5`), being the lineage
`0dab1221 → 8c99627 → d4fdb33 → 6828155`, within the scope of §6.

**Basis:** acceptance criteria in §7 all PASS or RESOLVED; no acceptance-critical defect exists.

**Limits of acceptance:** acceptance is **scope-bound, environment-bound and commit-bound** to the
artefact and environment recorded in §3–§4. Acceptance does not extend to any descendant commit,
any other environment, any excluded scope, or any future modification of the accepted artefact.

---

## 9. PROMOTION STATUS (SEPARATE — NOT GRANTED)

```text
PROMOTION AUTHORITY = NOT ESTABLISHED BY THIS ACT
PROMOTION           = NOT PERFORMED
main                = 4d3e1cdca3a33da0ec3be8b336b17128108a502c (UNMOVED; last moved 2026-09-23)
```

Durable findings supporting separation:

* The project's own acceptance convention **excludes** integration: `P01-01-ACCEPTANCE-ACT.md`
  and `P01-01-ACCEPTANCE-RE-EXERCISE-RECORD.md` both record that acceptance excludes
  “**integration** of the candidate into PMD `main` (no merge, cherry-pick, rebase, or copy)”.
* BI-08 reconciliation artefacts record a main merge via PR as “a **separate disposition**”.
* Governing rule quoted durably in `P01-01-ACCEPTANCE-CRITERIA-AUTHORITY-ACT.md`:
  “**Explicit gate acceptance; no automatic promotion**.”
* `main` has not moved since PR #4 (2026-09-23); subsequent integration PRs (#5, #6) targeted the
  integration branch `arena/01a0e6d9-…`, not `main`; no PR has ever been opened from
  `arena/01a0f308-…`.
* No durable act authorising advancement of `main` to `0dab1221` was located.

**Baseline/integration-line promotion vs NP04 promotion are distinct acts.** `main → 0dab1221`
(23 commits, 36 files, including `src/pit`, `src/d114`, `src/contracts` changes from the IU/P01
line) is a **separate** governance act from promoting the NP04 lineage
`0dab1221 → 8c99627 → d4fdb33 → 6828155`. Promotion to `main` would necessarily carry the
baseline promotion with it; consequently the target lineage must be decided explicitly in the
next gate. No promotion mechanism (PR, merge, or otherwise) is authorised or performed here.

---

## 10. DURABILITY OF THIS ACCEPTANCE RECORD

This record is committed to the governance branch
`refs/heads/arena/01a0f839-iips-production-market-data` and pushed to the authoritative IPD
remote; its remote commit SHA and blob SHA are reported in the NP04-G31 gate report. A record that
is only local is **not** durable; durability requires remote ref, commit and tree verification.

Evidence-of-record commands (reference only; full output not reproduced):

```text
node --test dist/tests/g24_*.test.js      # 84/84
npm test                                  # 782/782  (×3)
npm run build:tsc                         # exit 2 — 4 pre-existing errors (identical at 0dab1221)
npm run build:vite                        # exit 0
git diff --name-status 0dab1221..HEAD     # 40 A (9 tests), 2 M (package.json, package-lock.json)
```

---

## 11. LIMITATIONS AND CAVEATS

1. **Environment-bound:** qualification was executed on Node v22.22.3 / linux x64 with the exact
   lockfile set; other environments are not covered by this acceptance.
2. **Unsigned commits:** the lineage and governance commits are authored by
   `arena-ai-coding-agent[bot]` and are not cryptographically signed; provenance rests on remote
   ref integrity, not signatures.
3. **Transient qualification workspace:** G30 evidence was generated in temporary clones, which
   did not persist between sessions. This acceptance act is the durable anchor: it binds the
   result to the immutable commit and tree hashes above. Re-execution in a future gate reproduces
   the evidence from those anchors.
4. **GATE-P remains separate:** nothing here grants authority over P-A…P-F application domains.
5. **`2f5613e`:** remains unrecoverable and is not recreated; this act does not validate G25/G26.
6. **Gate-numbering note:** the label “NP04-G32” is already used by the durable NP04 governance
   record (`NP04-G32: canonical NP04 governance authority record`, commit
   `6828155ec6e882bbb4cabcd96b5a841d8c8a6bc4`). Any next gate should carry a distinct act
   identifier even if the conversational label repeats.
7. **Evidence-location separation is intentional** and must not be collapsed by convenience
   (see §2).

---

## 12. ATTESTATION (verified before commit)

| Check | Result |
| --- | --- |
| Implementation files changed by this act | **0** |
| Test files changed by this act | **0** |
| Dependency / lockfile changed by this act | **0** |
| Migration files changed by this act | **0** |
| Protected-surface files changed by this act | **0** |
| `main` modified | **NO** |
| `arena/01a0f308-…` modified | **NO** (still `6828155`) |
| New artefacts | exactly one — this file |
| Authorised scope expanded | **NO** |

**Recording attestation.** Prepared by Arena as **Recording Agent** only. It records the
acceptance decision instructed by the Program Authority against independently established
qualification evidence. It selects nothing beyond that decision and authorises nothing beyond its
own creation.

---

*End of record `np04-g31-phase-a-acceptance-2026-10-01-001`.*
