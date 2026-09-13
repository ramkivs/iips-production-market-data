# P00 — EVIDENCE CONVENTIONS

Binding evidence standard for all subsequent P01–P17 work.

> **No evidence may be invented.** An assertion without a resolvable reference is not evidence.
> **UNKNOWN is preferable to guessing** — a gap is recorded as a gap.

---

## 1. Mandatory reference elements

Every evidence reference MUST contain:

| # | Element | Requirement |
|---|---|---|
| 1 | **Repository / path** | Repository name + path from its root |
| 2 | **Line or section** | Line number for source; section/§ for documents; sheet + cell/row for the tracker |
| 3 | **Pinned commit** | The commit SHA the reference was read at. **Mandatory** |
| 4 | **Artifact identity** | Artifact name/ID (e.g. `IES-017`, `E2E-030`, `ADR-01`, `UI05`, `C2`) |
| 5 | **Execution/result evidence** | Where applicable: test/run identifier, result, and the produced artifact (snapshot ID, evidence ID, hash/triple) |

### Canonical formats

```
Source:    <repo>/<path>:<line> @ <commit>
Document:  <repo>/<path> §<section> @ <commit>
Tracker:   TRACKER/<sheet>!<cell-or-row> @ <checksum>
Execution: <suite>::<test> → <result> @ <commit>  [artifact: <id/hash>]
```

**Examples (illustrating format only):**
- `iips-review-recovered/iips-platform/src/distributed/LiveDataRuntime.ts:78 @ 5decdca`
- `iips-production-market-data/docs/d5/ADR-01_NAMESPACE_COLLISION_GUARD.md §C.2 @ <commit>`
- `TRACKER/Phase Gates!A2:E19 @ f0bd7b97…`

---

## 2. Why the pinned commit is mandatory — CD-01

Recorded in `docs/d7/D7_EVIDENCE_NOTES.md` and carried forward by `docs/d8/D8_EVIDENCE_NOTES.md`
EN-07: D4 and D5 cite the unguarded merge at `LiveDataRuntime.ts:**76**`; the current clone
shows the same statement at `:**78**`. Same repository, same commit `5decdca`, same code, same
behaviour — a **line-number citation offset only**, with no authority, methodology, contract or
disposition impact.

**Rule:** commit-pinning makes this class of drift self-evident and diagnosable. An unpinned
line citation is **not** conforming evidence.

**CD-01 remains open** and is scheduled for a dedicated citation-cleanup run; D4/D5/D7 are
immutable historical records and were not edited.

---

## 3. Evidence classes

| Class | Definition | Certifiable? |
|---|---|---|
| **PRIMARY SOURCE** | Code, contract or data artifact read at a pinned commit | Yes |
| **EXECUTION EVIDENCE** | Test/run output with identifier and result | Yes |
| **CERTIFICATION ARTIFACT** | An issued certification document | Yes — read-only to this program |
| **DERIVED ANALYSIS** | A conclusion computed from primary sources; must cite each | Only with its inputs |
| **RECORDED DECISION** | An authority decision, cited to its artifact | As a decision, not as technical evidence |
| **SYNTHESIZED / LITERAL** | Hard-coded or generated values (e.g. `confidence: 0.8`; `reproduced: true`) | **NO — never presented as real lineage or verified reproduction** |
| **GAP** | Not locatable / not decided | **NO** — record as UNKNOWN, never fill by assumption |

---

## 4. Prohibitions

| # | Prohibition |
|---|---|
| 1 | Inventing evidence, line numbers, commits, dates or artifact IDs |
| 2 | Citing an artifact not actually inspected |
| 3 | Presenting hard-coded confidence/provenance/freshness literals as real lineage |
| 4 | Presenting `reproduced` / `byteIdentical` literals as verified reproduction (**AD-17 unresolved**) |
| 5 | Converting an UNKNOWN or DEFERRED item into an assumption |
| 6 | Inferring authority from commit messages, repository ownership, code authorship or document authorship |
| 7 | Treating a preparation document as an approval |
| 8 | Treating authority approval as certification or gate acceptance |
| 9 | Unpinned line-level source citations |
| 10 | Volume in place of substance — report length is not the objective |

---

## 5. Evidence lineage D4 → D5 → D7 → D8 → P00

| Stage | Artifacts | Evidence contribution | Status |
|---|---|---|---|
| **D1 / D3** | (reports) | Repository inspection; contract location; test baselines (platform 454/506; frontend 149 pass/12 fail/25 skip); M-1 isolation | Historical |
| **G-A** | Authority record | 14 authority decisions | Authoritative |
| **D4** | `docs/d4/D4_00`–`D4_15` | Specification baseline: INT rows, D01–D10, 19 surfaces, ingress delta, identity, replay, namespace, 13 engines, P12, P13, certification matrix, phase sequence, tracker corrections, authority register | **Immutable baseline** (corrected by D4-B) |
| **D4-B** | `D4_03`, `D4_10`, `D4_12` | Traceability corrections C-01/C-02/C-03 | Applied |
| **D5** | `docs/d5/` | ADR-01, ADR-02 preparation; E-01, E-02 escalations; register; dependency map | **Immutable** |
| **D6** | (reconciliation) | Read-only: no authority change detected | Historical |
| **D7** | `docs/d7/` | Authority-hold handoff; CD-01 recorded | **Immutable** |
| **D8** | `docs/d8/` | Authority reconciliation; execution authorization; WP-P00-01 selection | **Authoritative current state** |
| **P00** | `docs/p00/` | This governance baseline | **Current** |

**Immutability rule:** D4, D5 and D7 are historical records. Corrections are made in **new**
artifacts that cite the original, never by editing history.

---

## 6. Evidence required at every gate

Baseline for all phases (tracker): *phase-specific tests + artifacts + lineage/evidence +
concessions register*, plus:

1. Artifact inventory with checksums.
2. Integrity proof that forbidden files are unchanged (checksums / `git status`).
3. Traceability matrix: each claim → its cited source.
4. Open-item status at the time of the gate.
5. Explicit boundary/integrity statement.
6. Execution evidence where the phase produces runnable behaviour.
