# NP04 — FRESH AUTHORITY ACT: PHASE-A ADOPTION

**Act identifier:** `np04-g29-fresh-authority-phase-a-adoption-2026-10-01-001`
**Authority:** RAMKI (Program Authority) — instruction "NP04-G29 — Fresh NP04 Authority Act (Phase-A Adoption) + Durability Pre-flight" (2026-10-01)
**Recording Agent:** Arena (recording only — no implementation performed, authorized, or implied by this record)
**Scope:** NP04 — IPD durable user-portfolio persistence foundation
**Nature:** FRESH AUTHORITY / ADOPTION AUTHORIZATION (governance artifact only)
**Governing Standards:** AD-01..AD-18 / AD-CHARTER-2026-01
**Execution Mode:** NON_PRODUCTION
**Recorded At (local, Asia/Calcutta):** 2026-10-01
**Antecedent Checkpoint (repository state at recording):** `4d3e1cdca3a33da0ec3be8b336b17128108a502c`
**Session Branch:** `arena/01a0f839-iips-production-market-data`
**Repository:** `ramkivs/iips-production-market-data` (IPD — authoritative)

---

## 1. PURPOSE AND CHARACTER OF THIS ACT

This is a **fresh authority act**. It adopts the surviving NP04 implementation lineage as the
**canonical Phase-A durable-persistence implementation candidate** and authorizes **adoption /
revalidation** — not implementation.

This act:

* does **not** retroactively validate G25 or G26;
* does **not** recreate, reconstruct, or approximate `2f5613e`;
* does **not** declare the surviving implementation currently **qualified**;
* does **not** declare the surviving implementation currently **accepted**;
* does **not** promote anything to `main`;
* does **not** authorize any new implementation.

It establishes the authority boundary under which the surviving implementation may proceed to
independent requalification, explicit acceptance, and controlled durability/promotion work.

---

## 2. VERIFIED ANTECEDENT STATE (inspected read-only before recording — not assumed)

| Item | Verified value |
| --- | --- |
| Authoritative remote | `origin` → `https://github.com/ramkivs/iips-production-market-data.git` (sole remote) |
| Authoritative default branch | `refs/heads/main` = `4d3e1cdca3a33da0ec3be8b336b17128108a502c` (**unmoved**) |
| Authorized baseline | `0dab1221fb0f89e2e0601ea905d642bfe72d5f9c` — merge of PR #6; branch `arena/01a0e6d9-iips-production-market-data` |
| Implementation candidate | `8c9962725666be76ad58f52fd493a52479d0b75e` — parent `0dab1221fb…` (verified) |
| Migration / audit correction | `d4fdb33d9810b0736a9a382d6ab35b7ce2a7480e` — parent `8c9962725666…` (verified) |
| Continuation tip | `6828155ec6e882bbb4cabcd96b5a841d8c8a6bc4` — parent `d4fdb33d98…` (verified); branch head of `arena/01a0f308-iips-production-market-data` |
| Lineage continuity | `0dab1221 → 8c99627 → d4fdb33 → 6828155` — clean, single-parent chain, no divergence |
| Remote containment | Baseline and tip present on the remote; tip equals the remote branch head |
| Competing implementation | **NONE** — `src/persistence` exists on exactly one remote head (`arena/01a0f308-…`) |
| `2f5613e` | **ABSENT** — remote commit lookup returns `422 No commit found`; absent from local objects, all remote heads, tags and pull refs |
| Protected surfaces (baseline → tip) | **0 changed** across `frontend/src/features/portfolio/`, `src/pit/`, `src/d114/`, `src/identity/`, `src/contracts/`, `src/ingress/`, `src/oq/`, `src/ui/`, `src/security/`, `src/operator_drop/`, `src/e2e/`, `docs/` |
| Whole-tree delta (baseline → tip) | 42 added / 2 removed; the **only** modified pre-existing files are `package.json` and `package-lock.json` |
| Same-identity provenance | All three NP04 commits authored and committed by `arena-ai-coding-agent[bot]`; unsigned (`verification.verified = false`) |

---

## 3. AUTHORITY DECISION

```text
NP04 FRESH AUTHORITY — PHASE-A ADOPTION = ESTABLISHED
```

| Element | Exact value |
| --- | --- |
| Authorized baseline | `0dab1221fb0f89e2e0601ea905d642bfe72d5f9c` |
| Authorized implementation candidate | `8c9962725666be76ad58f52fd493a52479d0b75e` |
| Authorized corrective lineage | `d4fdb33d9810b0736a9a382d6ab35b7ce2a7480e` |
| Authorized continuation tip | `6828155ec6e882bbb4cabcd96b5a841d8c8a6bc4` |

**Authority meaning.** The authority established is to:

> Adopt the surviving NP04 implementation lineage as the canonical Phase-A
> durable-persistence implementation candidate and proceed with independent requalification,
> explicit acceptance, and controlled durability/promotion work.

This is **adoption / revalidation**. It is **not** new implementation. The authority is a new
act; it is not a continuation, ratification, or revival of G25/G26.

---

## 4. AUTHORIZED SCOPE (exhaustive)

The authority of this act is limited to the **IPD durable user-portfolio persistence foundation
represented by the surviving NP04 lineage**, and covers only:

1. durable IPD **user-portfolio domain**;
2. **SQLite** persistence substrate;
3. exact **`better-sqlite3@13.0.3`**;
4. persistence lifecycle **validate → connect → migrate → verify → listen**;
5. **fail-closed** database errors;
6. **no in-memory persistence fallback**;
7. configuration exclusively through **`IPD_PORTFOLIO_DB_PATH`**;
8. **tenant-membership persistence foundation** as already represented in the surviving
   implementation (not tenant administration — see §6);
9. **`applicationUserId + tenantId + portfolioId`** authorization binding;
10. additive **`/api/ipd`** boundary;
11. **G24 internal Phase A** persistence foundation;
12. **G24 internal Phase B** migration infrastructure **only insofar as it already exists in the
    adopted lineage and is required by the persistence foundation**.

This authority does **not** extend to any new feature-domain persistence.

---

## 5. DEPENDENCY DECISIONS

### 5.1 `better-sqlite3@13.0.3`

```text
better-sqlite3@13.0.3 = AUTHORIZED (already represented in the adopted lineage)
```

Exact pin, no range. No upgrade, downgrade, or range-widening is authorized.

### 5.2 `@types/better-sqlite3@9.6.0`

```text
@types/better-sqlite3@9.6.0 = AUTHORIZED
```

Basis recorded by the authority instruction:

* it exists as the exact dev dependency in the surviving implementation;
* it is required to type the already-authorized `better-sqlite3` integration;
* authorizing it introduces **no new runtime dependency**;
* the exact version is already represented in the surviving lineage.

**No other type, tooling, or dependency package is authorized by this act.** No upgrade of this
package is authorized.

### 5.3 Project-level `engines` field

```text
Project-level engines field = NOT AUTHORIZED / NOT REQUIRED
```

* `engines` is **not** to be added to `package.json`.
* `>=22 <23` is **not** to be declared.
* Package metadata is **not** to be modified merely to reproduce the historical G25 claim.

The only authoritative fact recorded is that the `better-sqlite3@13.0.3` dependency metadata
requires Node `>=22`. The project-level `<23` constraint is not established by durable repository
evidence and must not be introduced as a new constraint. No `package.json` modification is
authorized for this purpose.

---

## 6. BASELINE / MAIN RELATIONSHIP

```text
NP04 working baseline = 0dab1221fb0f89e2e0601ea905d642bfe72d5f9c
```

* `main` is **not** advanced by this act.
* Nothing is merged into `main` by this act.
* The surviving NP04 implementation continues from
  `6828155ec6e882bbb4cabcd96b5a841d8c8a6bc4`.
* The implementation is **not** transplanted back onto `4d3e1cd…`.

```text
Advancement of main to the NP04 baseline is a separate promotion / integration
governance act and is outside this authority act.
```

Tenant administration, tenant lifecycle expansion, `REVOKED → ACTIVE` restoration semantics,
tenant membership audit, and cross-system security-audit delivery remain **DEFERRED /
NOT AUTHORIZED** as previously recorded; this act does not narrow, expand, or resolve them.

---

## 7. ADOPTION VERSUS REIMPLEMENTATION

```text
ADOPTION / REVALIDATION = AUTHORIZED
NEW IMPLEMENTATION      = NOT AUTHORIZED
```

The next engineering activity must begin **from the surviving lineage**.

Prohibited by this act:

* copying source files into a new implementation;
* manually reconstructing Phase A;
* cherry-picking, rebasing, or rewriting `8c99627`;
* reproducing `d4fdb33`;
* recreating `2f5613e`;
* creating any semantically equivalent replacement implementation;
* transplantation/re-writing of the adopted commits.

**Objective:** preservation of provenance and independent verification.

---

## 8. GATE-P BOUNDARY (MAINTAINED)

| Domain | Authority |
| --- | --- |
| NP04 IPD user-portfolio persistence | **AUTHORIZED for adoption/revalidation** |
| GATE-P P-A — Persistence Foundation | Separate governance domain — not governed by this act |
| GATE-P P-B — Watchlists | **NOT AUTHORIZED** |
| GATE-P P-C — Reports | **NOT AUTHORIZED** |
| GATE-P P-D — Collaboration | **NOT AUTHORIZED** |
| GATE-P P-E — Settings | **NOT AUTHORIZED** |
| GATE-P P-F — Governed Screener | **NOT AUTHORIZED** |

The existence of the NP04 implementation does **not** grant implementation authority for the
GATE-P application domains. No GATE-P record is reopened, modified, or superseded by this act.

---

## 9. REQUALIFICATION REQUIREMENT

```text
CURRENT QUALIFICATION: NOT YET ESTABLISHED
```

Historical qualification evidence (G24/G32 execution records) is **historical only** and is not
current qualification. The next engineering gate must independently re-run the applicable:

* tests;
* typecheck;
* build;
* persistence-specific verification;
* protected-surface verification;
* dependency verification;
* relevant regression suites.

The implementation must not be declared qualified on the basis of historical reported results.

---

## 10. ACCEPTANCE REQUIREMENT

```text
ACCEPTANCE: NOT YET ESTABLISHED
```

A separate, explicit acceptance act is required **after** independent requalification. Authority,
qualification, and acceptance are distinct states and must not be combined.

| # | State | Status after this act |
| --- | --- | --- |
| 1 | Authorized for adoption | **ESTABLISHED** |
| 2 | Implementation survives | **ESTABLISHED** |
| 3 | Requalified | NOT ESTABLISHED |
| 4 | Accepted | NOT ESTABLISHED |
| 5 | Promoted / durable | NOT ESTABLISHED |

---

## 11. DURABILITY PRE-FLIGHT — PUSH CAPABILITY

**Prior classification (G28):** `INDETERMINATE`.

**Authorized probe (this act):** exactly one controlled push, solely to establish whether this
IPD-bound session can create/update **its own designated remote branch**.

Probe constraints:

* push **only** to the session branch `arena/01a0f839-iips-production-market-data`;
* the session branch does **not** exist on the remote → the push **creates** a ref and cannot
  overwrite any existing branch;
* **no** push to `main`;
* **no** modification of `arena/01a0f308-iips-production-market-data` or any other NP04 branch;
* **no** application code in the pushed content — this governance record only.

**Outcome rule.**

| Probe result | Classification | Consequence |
| --- | --- | --- |
| Push succeeds and remote SHA/tree verify | `VERIFIED AVAILABLE` | This record is durable; durability sequence may proceed in later gates |
| `403` / permission failure | `VERIFIED UNAVAILABLE` | **STOP durability work**; no repeated attempts, no workarounds, no credential changes; this record remains **non-durable (local-only)** |

The **operative result** of the probe is recorded in the NP04-G29 gate report. No outcome is
asserted by this section; a locally committed governance record is **not durable** until remote
verification succeeds.

---

## 12. PROVENANCE AND NON-IMPLICATION STATEMENTS

* This is a **fresh authority act**.
* It does **not** retroactively validate G25/G26.
* It does **not** recreate `2f5613e`.
* It does **not** declare the surviving implementation currently qualified or accepted.
* **`2f5613e` remains unrecoverable** and is not recreated; the Phase-A substantive
  implementation survives elsewhere as a superset within the adopted lineage.
* An implementation mechanism is not converted into governance authority anywhere in this
  record. Code identifiers are recorded as identifiers only.
* No existing governance artifact is modified, reinterpreted, or superseded by this act.
* G29 (this gate) does not begin Phase-A implementation changes.

---

## 13. EXPLICIT NON-AUTHORIZATIONS

This act does **not** authorize: Watchlists persistence; Reports persistence; Collaboration
persistence; Settings persistence; Governed Screener persistence; modification of any protected
foundation; modification of `main`; merging into `main`; reimplementation of the surviving
Phase-A code; transplantation or re-writing of `8c99627` or `d4fdb33`; broad dependency upgrades;
unrelated cleanup; production work; any credential, remote, or permission change.

---

## 14. ATTESTATION (verified before commit)

| Check | Result |
| --- | --- |
| Working tree clean at recording | CLEAN — 0 modified, 0 untracked |
| Branch | `arena/01a0f839-iips-production-market-data` |
| HEAD before commit | `4d3e1cdca3a33da0ec3be8b336b17128108a502c` |
| Baseline SHA matches authority | YES — `0dab1221fb0f89e2e0601ea905d642bfe72d5f9c` |
| Implementation candidate SHA matches | YES — `8c9962725666be76ad58f52fd493a52479d0b75e` |
| Corrective SHA matches | YES — `d4fdb33d9810b0736a9a382d6ab35b7ce2a7480e` |
| Continuation tip SHA matches remote branch head | YES — `6828155ec6e882bbb4cabcd96b5a841d8c8a6bc4` |
| Competing NP04 implementation present | NO |
| `2f5613e` appears | NO |
| Implementation files changed by this act | 0 |
| Protected-surface files changed by this act | 0 |
| Dependency files changed by this act | 0 |
| New artifacts | exactly one — this file |

**Recording attestation.** Prepared by Arena as **Recording Agent** only. It records the
authority decision instructed by the Program Authority and verifies the repository facts on which
that decision rests. It selects nothing, ranks nothing, recommends nothing beyond the instructed
decision, and authorizes nothing beyond its own stated scope.

---

*End of record `np04-g29-fresh-authority-phase-a-adoption-2026-10-01-001`.*
