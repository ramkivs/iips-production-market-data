# Institutional Investment Platform System (IIPS)
# GP-2 — Storage Target: Decision Record (no designation established)

**Governing Standards:** AD-01..AD-18 / AD-CHARTER-2026-01
**Authority Act ID:** `gp-2-storage-target-decision-2026-09-26-001`
**Governing Authority:** RAMKI (Authorizing Authority)
**Recording Agent:** Arena (recording only — no designation made, no technology selected)
**Act Type:** STORAGE TARGET DECISION RECORD — NO DESIGNATION ESTABLISHED (non-executable)
**Recorded At (local, Asia/Calcutta):** 2026-09-26
**Antecedent Checkpoint:** `bdd798b6f14df54391b1ad235e891fa211dec49a`

---

## 1. VERIFIED ANTECEDENT STATE (inspected, not assumed)

| Item | Verified value |
| --- | --- |
| Authoritative remote | `origin` → `https://github.com/ramkivs/iips-production-market-data.git` (sole) |
| Authoritative branch | `refs/heads/main` @ `4d3e1cdca3a33da0ec3be8b336b17128108a502c` (UNCHANGED) |
| Workstream branch | `arena/01a0ddae-iips-production-market-data` |
| HEAD at recording | `bdd798b6f14df54391b1ad235e891fa211dec49a` (the GP-1 act commit) |
| LOCAL == REMOTE before mutation | TRUE — `git ls-remote` and GitHub API agree |
| Worktree | CLEAN (0 entries) |
| GP-1 at committed state | PRESENT — `PERSISTENCE_GOVERNANCE_AUTHORITY = ESTABLISHED BY THIS ACT`, `STORAGE_AUTHORITY = NOT GRANTED` |
| GP-2 previously established | NO — 0 storage-target designations, 0 `STORAGE_AUTHORITY` grants repo-wide |
| GATE-Y | UNTOUCHED — 0 filenames, 0 act IDs; both `SELECTED_READ_ONLY_GATE` rows read GATE-P |

## 2. DECISION

```text
GP-2    = NOT ESTABLISHED
REASON  = AUTHORITY / EVIDENCE INSUFFICIENT
```

No authoritative storage target exists in this repository, and none can be derived from existing
evidence without a RAMKI determination. **No technology was selected.** A storage target was not
chosen to unblock progress.

## 3. EVIDENCE SWEEP — WHAT WAS ACTUALLY FOUND

Each category the authorization named was inspected. Findings are separated into
**observed repository fact**, **existing governance authorization**, **unresolved design choice**,
and **external dependency**.

### 3.1 Observed repository fact

| Category | Finding |
| --- | --- |
| Explicit governance designation of a storage target | **NONE.** The only occurrences of "storage target" repo-wide are this workstream's own records stating that none exists |
| Environment configuration | **NONE.** 0 tracked `.env*` files of any kind |
| Deployment / hosting records | **NONE.** `.github`, `.gitlab-ci.yml`, `Dockerfile`, `docker-compose.yml`, `k8s`, `helm`, `terraform`, `Procfile` — all ABSENT |
| Dependency declarations | `dependencies` = `react-router-dom` only. No database, driver, ORM, or storage library |
| Existing persistence implementation | **NONE.** 0 filesystem writes in product source; 0 browser-storage calls; in-memory `Map` state only |
| Build / runtime config | `vite.config.ts` declares a **dev-server** block (`port 5173`, `allowedHosts`) annotated in-file as "LOCAL DEV SERVER ONLY — it is not a production setting", and `build.outDir: 'dist-frontend'` — a build output directory, not a data store |
| Documented storage boundary in `docs/` | **NONE** |

### 3.2 Existing governance authorization

| Item | State |
| --- | --- |
| Act authorizing a storage target | **NONE** |
| `STORAGE_AUTHORITY` anywhere in the repository | recorded only as **NOT GRANTED** (GP-1) |
| GP-1 scope | governance authority only; GP-1 §5 records `STORAGE_AUTHORITY = NOT GRANTED` |

### 3.3 Unresolved design choice (belongs to RAMKI, not to Arena)

Class of target (in-process only / client-local / filesystem artifact / server-backed store),
durability lifetime, ownership scoping, retention, and schema are all **undetermined**. Nothing in
the repository constrains the choice to a single answer, so no answer can be derived.

### 3.4 External dependency

| Dependency | State |
| --- | --- |
| D115 C/D identity binding | UNRESOLVED / WITHHELD / NOT AUTHORIZED |
| `runtimeCompanyId` | UNRESOLVED |
| `PHASE5` §3 transport exclusions | in force (relevant only if a server-backed target were ever chosen) |

## 4. NEAR-MISS CANDIDATE — EXAMINED AND REJECTED

`src/d114/evidence_handoff.ts` declares `DEFAULT_INTAKE_DIR = 'evidence/d114'` with a fixed
`REQUIRED_ARTIFACTS` contract of six JSON files. It is the closest thing in the repository to a
governed directory contract, and it is **not** a storage target for this workstream:

| Test | Result |
| --- | --- |
| Direction of I/O | **READ-ONLY** — `existsSync`, `statSync`, `readFileSync` only; no write call exists |
| Purpose | **Intake** of an externally produced D114 historical evidence package |
| Data governed | governance/evidence artifacts — **not** application data |
| Relation to GATE-P domains | none; it governs no Watchlist, Report, Collaboration, Setting, or Screener record |
| Package state | `src/d114` is **FROZEN** (tree `0062ad52`, identical at baseline and HEAD) |

Likewise the `evidence/` tree is a governed store for **governance artifacts** across 13 packages.
Neither is promoted into an application-data storage target. Presence is not permission, and
technical availability is not designation.

## 5. EXACT MISSING AUTHORITY / EVIDENCE REQUIRED

| # | Required before GP-2 can be established |
| --- | --- |
| M-1 | A RAMKI determination selecting the **class** of storage target (in-process / client-local / filesystem artifact / server-backed) |
| M-2 | A bounded scope for that target: which of the six GATE-P domains it serves |
| M-3 | Durability lifetime and retention semantics |
| M-4 | Ownership scoping — blocked by D115 C/D and `runtimeCompanyId` (GP-4) |
| M-5 | A hosting decision, if the selected class requires one — that is GP-5, not authorized |
| M-6 | Relief from `PHASE5` §3, if and only if the selected class requires the excluded transport — that is GP-3, not authorized |

## 6. DECISION BOUNDARY — STOPPED HERE

RAMKI's determination is required to designate a storage target. Arena has **not** manufactured
that choice, has not proposed a class, has not ranked the options in §5 M-1, and has not prepared
an implementation plan. The four classes are listed as an enumeration of the undetermined design
space, not as a recommendation.

## 7. AUTHORITY STATES — RECORDED SEPARATELY

| Authority / dependency | State |
| --- | --- |
| `GP-1` | **ESTABLISHED** |
| `GP-2` | **NOT ESTABLISHED** |
| `GP-3` | **NOT AUTHORIZED** |
| `GP-4` | **UNRESOLVED / OUTSIDE THIS STEP** |
| `GP-5` | **NOT AUTHORIZED** |
| `GP-6` | **NOT AUTHORIZED** |
| `IMPLEMENTATION_AUTHORITY` | **NOT GRANTED** |
| `PERSISTENCE_IMPLEMENTATION_AUTHORITY` | **NOT GRANTED** |
| `STORAGE_AUTHORITY` | **NOT GRANTED** |
| `TRANSPORT_AUTHORITY` | **NOT GRANTED** |
| `PAYLOAD_DATA_AUTHORITY` | **NOT GRANTED** |
| `D115_IDENTITY_AUTHORITY` | **UNCHANGED** — WITHHELD / UNRESOLVED / NOT AUTHORIZED |
| `PRODUCTION_AUTHORITY` | **UNCHANGED** — `productionEligible: false` |

## 8. PRESERVATION

No existing record was modified. `A-1`, the GATE-P selection record, the GATE-P findings record,
the post-GATE-P authority packet, `GP-1`, the D8 historical position, and all frozen
qualification, certification, and release records remain byte-identical. No source, test,
configuration, deployment, or runtime file was touched. This act is purely additive.

## 9. D8 — PRESERVED / UNCHANGED

```text
D8_REPOSITORY_TOKEN               = NOT FOUND
D8_HISTORICAL_GOVERNANCE_REFERENT = AUTHORITY-ASSERTED / EXTERNAL
D8_TRACEABLE_REPOSITORY_EVIDENCE  = NOT ESTABLISHED
D8_IMPLEMENTATION_AUTHORITY       = NOT ESTABLISHED BY A-1
```

## 10. NEXT AUTHORITY ACTION (not authorized by this act)

A RAMKI determination on §5 M-1 and M-2. Until it is recorded, GP-2 remains `NOT ESTABLISHED` and
no storage target exists. Arena must not select one, and must not treat §5 as a work plan.

---

**End of Decision Record. No storage target designated. No implementation authorized, performed, or implied.**
