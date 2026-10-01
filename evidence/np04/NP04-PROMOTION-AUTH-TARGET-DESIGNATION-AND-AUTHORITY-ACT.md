# NP04 — PROMOTION AUTHORITY ACT: TARGET DESIGNATION & NP04 PROMOTION AUTHORITY

**Act identifier:** `np04-promotion-auth-target-designation-2026-10-01-001`
**Authority:** RAMKI (Program Authority) — instruction "NP04-PROMOTION-AUTH — Target / Promotion Authority Decision" (2026-10-01)
**Recording Agent:** Arena (recording only — no promotion executed, no implementation change, no PR, no merge)
**Scope:** Target designation and NP04 promotion authority for the already-accepted Phase-A implementation
**Nature:** AUTHORITY / DESIGNATION ACT (governance artifact only)
**Governing Standards:** AD-01..AD-18 / AD-CHARTER-2026-01
**Execution Mode:** NON_PRODUCTION
**Recorded At (local, Asia/Calcutta):** 2026-10-01
**Repository:** `ramkivs/iips-production-market-data` (IPD — authoritative)
**Recording branch (this record):** `arena/01a0f839-iips-production-market-data`

---

## 1. PURPOSE AND CHARACTER OF THIS ACT

This act establishes, for the first time, (a) the **target** to which the already-accepted NP04
Phase-A implementation is intended to be promoted, and (b) the **authority** under which that
promotion may later be executed as a separate execution gate.

This act **does not execute promotion**. It creates no merge, no fast-forward, no
cherry-pick, no rebase, no copy, no PR, and no implementation change. It performs no
qualification or acceptance activity and reopens neither G30 nor G31.

---

## 2. VERIFIED ANTECEDENT STATE (inspected read-only before recording — not assumed)

| Item | Verified value |
| --- | --- |
| Accepted NP04 tip | `6828155ec6e882bbb4cabcd96b5a841d8c8a6bc4` (branch head of `arena/01a0f308-iips-production-market-data`; parent `d4fdb33d98…`) |
| Accepted tree (G31) | `eb07ea36059c6e2d3f1b6ff9afb8e3fb0c562cc5` — root tree of the accepted tip, unchanged |
| NP04 baseline | `0dab1221fb0f89e2e0601ea905d642bfe72d5f9c` (tree `e754acff9919902508b476fcbb4d1ff8fbfb28f0`; branch head of the target branch) |
| `main` | `4d3e1cdca3a33da0ec3be8b336b17128108a502c` — **unmoved** (last moved 2026-09-23) |
| Target branch (this act) | `arena/01a0e6d9-iips-production-market-data` @ `0dab1221fb0f89e2e0601ea905d642bfe72d5f9c` |
| Promotion state | **NOT PERFORMED** — `0dab1221 → 6828155` = ahead 3 / behind 0 (clean fast-forward available, not applied) |
| G29 authority record | retrievable; `evidence/np04/NP04-G29-FRESH-AUTHORITY-PHASE-A-ADOPTION-ACT.md`, commit `f4ceecb192f1d2e4ec7f67b6ac6615e71871eac8`, blob `111a380a714d3beece90bef3040e9d381039a7bf` — verified |
| G31 acceptance record | retrievable; `evidence/np04/NP04-G31-PHASE-A-ACCEPTANCE-ACT.md`, commit `3a89c70e77a6172ee4f75aa9c5d2dc441f4543d0`, blob `614994da55525e94d1d7c6d0880c55f65236bd5c` — verified |
| Competing NP04 implementation | **None** (`src/persistence` exists on exactly one remote head) |
| Branch restrictions | target branch `protected=false`, rulesets = 0, rules = 0 |

---

## 3. TARGET DESIGNATION

```text
NP04 PROMOTION TARGET = arena/01a0e6d9-iips-production-market-data
```

**This act is the act that establishes the designation.** The target branch had **not** previously
been designated or authorized as an NP04 promotion target by any durable artifact.

Factual rationale recorded (evidence, not preference):

1. the branch already carries the NP04 prerequisite baseline `0dab1221fb0f89e2e0601ea905d642bfe72d5f9c`;
2. `0dab1221 → 6828155` is a clean fast-forward (ahead 3 / behind 0, merge-base = `0dab1221`);
3. the branch is the historical working/integration branch of the IU/P01 line — IU-1 and IU-2
   authority acts record it as the act-time repository branch and, for IU-2, “the authoritative
   repository …, branch `arena/01a0e6d9-iips-production-market-data` remains the source of truth”;
4. integration PRs #5 and #6 targeted this branch rather than `main`;
5. promoting NP04 here does **not** require simultaneously promoting the separate
   `main → 0dab1221` baseline delta;
6. NP04 itself changes **zero** protected-prefix files (baseline→tip: 0 of 13 protected prefixes);
7. no evidence establishes `main` as NP04's intended target;
8. no evidence establishes any other target.

---

## 4. PROMOTION SCOPE (EXHAUSTIVE)

```text
SOURCE          = 6828155ec6e882bbb4cabcd96b5a841d8c8a6bc4
TARGET          = arena/01a0e6d9-iips-production-market-data
PROMOTION UNIT  = the already-qualified and already-accepted NP04 Phase-A lineage
                  0dab1221fb0f89e2e0601ea905d642bfe72d5f9c
                    → 8c9962725666be76ad58f52fd493a52479d0b75e
                    → d4fdb33d9810b0736a9a382d6ab35b7ce2a7480e
                    → 6828155ec6e882bbb4cabcd96b5a841d8c8a6bc4
```

**Authorized by this act (subject to a separate execution gate):** promotion of exactly the above
unit, by fast-forward, into the designated target branch.

**Explicitly NOT authorized by this act:**

* `main → 0dab1221` (baseline promotion);
* baseline promotion into `main` in any form;
* P01 / IU / PIT / D114 promotion into `main`;
* promotion into `main` of the NP04 lineage;
* any production functionality;
* Watchlists, Reports, Collaboration, Settings, Governed Screener persistence;
* unrelated persistence work;
* modification of any protected foundation;
* any implementation change, including any change to the accepted artifact;
* any change to the accepted tree `eb07ea36059c6e2d3f1b6ff9afb8e3fb0c562cc5`.

---

## 5. EXPLICIT NP04 PROMOTION AUTHORITY

```text
Promotion of the already-accepted NP04 Phase-A implementation from
6828155ec6e882bbb4cabcd96b5a841d8c8a6bc4
into
arena/01a0e6d9-iips-production-market-data
may be executed as a separate subsequent execution gate.
```

| Requirement | Recorded state |
| --- | --- |
| Target branch | `arena/01a0e6d9-iips-production-market-data` |
| Source SHA | `6828155ec6e882bbb4cabcd96b5a841d8c8a6bc4` |
| Accepted tree | `eb07ea36059c6e2d3f1b6ff9afb8e3fb0c562cc5` |
| Scope | §4 — the exact accepted NP04 Phase-A lineage only |
| Qualification basis | **G30** remains the qualification basis (disposition A — PHASE-A CURRENTLY QUALIFIED) |
| Acceptance basis | **G31** remains the acceptance basis (act `np04-g31-phase-a-acceptance-2026-10-01-001`) |
| This act executes promotion | **NO** |
| Promotion execution requires | a **separate subsequent execution gate** |
| `main` | **NOT AUTHORIZED** by this act |
| Baseline promotion into `main` | **NOT AUTHORIZED** by this act |
| Force push | **NOT AUTHORIZED** |
| Merge, cherry-pick, rebase, copy | **NOT AUTHORIZED** — promotion is limited to fast-forward of the designated target ref |
| Only the exact accepted NP04 lineage | **YES** — nothing else may be promoted |
| Implementation changes | **NONE authorized** under this act |

**Promotion must not alter content.** The promoted tree at the target ref must become exactly
`eb07ea36059c6e2d3f1b6ff9afb8e3fb0c562cc5`; any deviation means the promotion executed the wrong
unit and must fail closed.

---

## 6. `main` MUST REMAIN SEPARATE

`main → 0dab1221fb0f89e2e0601ea905d642bfe72d5f9c` is a **separate baseline / integration-line
matter**. This act does **NOT** authorize:

* advancing `main` to `0dab1221`;
* advancing `main` to `6828155`;
* opening a `main`-targeted PR;
* any certification claim for P01-01 / P01-02;
* bypassing the existing P01 certification prerequisite;
* interpreting NP04 acceptance as `main`-integration authorization.

For the record: `main` integration for the baseline line is expressly withheld by its own
governance — `P01-01-A3-ACCEPTANCE-AUTHORITY-DESIGNATION-ACT.md` (“Integration authority (into PMD
`main`) | **NOT AUTHORIZED**”), `P01-01-ACCEPTANCE-ACT.md` (“Integration into PMD `main` may be
considered only after the appropriate acceptance **and** certification gates”), and the governing
rule “Explicit gate acceptance; no automatic promotion”. P01-01 / P01-02 are recorded as
“ACCEPTANCE-GOVERNED ONLY / NOT CERTIFICATION-BEARING”.

```text
Any future main integration requires its own authority decision.
```

---

## 7. INTENDED MECHANISM (RECORDED, NOT EXECUTED)

* fast-forward promotion is **technically available** (`0dab1221 → 6828155`, ahead 3 / behind 0; merge-base = `0dab1221`);
* **no force push is required** — and force push is not authorized;
* the accepted source tree must remain **byte-identical** (`eb07ea36059c…`);
* **no implementation modification** is permitted;
* no branch is overwritten: the target update is a pure linear advance;
* if repository convention requires a PR for this integration branch (PRs #5/#6 used PRs), that PR
  may be created **only during the later execution gate** after authority is established.

**No fast-forward, push, or PR is executed by this act.**

---

## 8. DURABILITY AND EVIDENCE

This act is recorded as a single governance artifact on the established governance-record branch
and pushed to the authoritative IPD remote. The operative durability values — exact path, commit
SHA, parent SHA, blob SHA, resulting tree SHA, containing ref, retrievability verification and
content verification — are reported in the **NP04-PROMOTION-AUTH gate report**, together with
post-push verification that the accepted NP04 SHA, the target branch SHA and `main` SHA are
unchanged.

A record that is only local is **not** durable. Durability requires remote ref, commit, tree and
blob verification.

---

## 9. NON-IMPLICATIONS

This act does not:

* execute or schedule promotion;
* alter, reopen, or extend G29 authority, G30 qualification, or G31 acceptance;
* validate G25/G26 or recreate `2f5613e` (which remains unrecoverable);
* designate `main` as a target or create any `main`-related authority;
* grant any GATE-P application-domain (P-A…P-F) authority;
* create tenant-administration, lifecycle-restoration, or audit-expansion authority;
* authorize production activation;
* modify any protected foundation;
* transfer any state automatically: `authorized → qualified → accepted → promoted` remain
  strictly separate, and promotion remains **NOT PERFORMED** until a separate execution gate
  completes and verifies it.

---

## 10. ATTESTATION (verified before commit)

| Check | Result |
| --- | --- |
| Accepted SHA verified unchanged | YES — `6828155ec6e882bbb4cabcd96b5a841d8c8a6bc4` |
| Accepted tree verified unchanged | YES — `eb07ea36059c6e2d3f1b6ff9afb8e3fb0c562cc5` |
| Target branch verified unchanged | YES — `0dab1221fb0f89e2e0601ea905d642bfe72d5f9c` |
| `main` verified unchanged | YES — `4d3e1cdca3a33da0ec3be8b336b17128108a502c` |
| Promotion performed | NO |
| Implementation files changed by this act | 0 |
| Test files changed by this act | 0 |
| Dependency files changed by this act | 0 |
| Protected-surface files changed by this act | 0 |
| G29 / G31 records modified | NO |
| New artifacts | exactly one — this file |

**Recording attestation.** Prepared by Arena as **Recording Agent** only. It records the target
designation and promotion authority instructed by the Program Authority against independently
verified repository facts. It selects nothing beyond that instruction and authorizes nothing
beyond its own stated scope.

---

*End of record `np04-promotion-auth-target-designation-2026-10-01-001`.*
