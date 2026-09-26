# Institutional Investment Platform System (IIPS)
# GP-6 — Contract Designation Scope — SCOPE DESIGNATION ACT

**Governing Standards:** AD-01..AD-18 / AD-CHARTER-2026-01
**Authority Act ID:** `gp-6-scope-designation-2026-09-26-001`
**Governing Authority:** RAMKI (Authorizing Authority — the scope selection below is RAMKI's)
**Recording Agent:** Arena (recording only — did not select, rank, or recommend either scope option)
**Act Type:** SCOPE DESIGNATION ACT (non-executable; GP-6 itself remains NOT AUTHORIZED)
**Recorded At (local, Asia/Calcutta):** 2026-09-26
**Antecedent Checkpoint:** `1c576b808f7f7f0fec0e31af633dae166ef3e4c7`

---

## 1. VERIFIED ANTECEDENT STATE (inspected, not assumed)

| Item | Verified value |
| --- | --- |
| Authoritative remote | `origin` → `https://github.com/ramkivs/iips-production-market-data.git` (sole) |
| Authoritative branch | `refs/heads/main` @ `4d3e1cdca3a33da0ec3be8b336b17128108a502c` (UNCHANGED) |
| Workstream branch | `arena/01a0ddae-iips-production-market-data` |
| HEAD at recording | `1c576b808f7f7f0fec0e31af633dae166ef3e4c7` |
| LOCAL == REMOTE before mutation | TRUE — `git ls-remote`, remote-tracking ref, GitHub API all agree |
| Worktree | CLEAN |
| GP-6 prior state | NOT AUTHORIZED · 0 scope acts · 0 per-domain designations |

## 2. SCOPE DESIGNATION

```text
GP-6 SCOPE = FOUR-DOMAIN
```

| ID | Domain | GP-6 scope |
| --- | --- | --- |
| P-B | Watchlists | **IN SCOPE** |
| P-C | Reports | **IN SCOPE** |
| P-D | Collaboration | **IN SCOPE** |
| P-E | Settings | **IN SCOPE** |

### 2.1 Explicit exclusions from GP-6 scope

| ID | Domain | Disposition |
| --- | --- | --- |
| P-A | Persistence Foundation | **OUTSIDE GP-6** — remains a persistence-foundation prerequisite / boundary |
| P-F | Governed Screener | **OUTSIDE GP-6** — retains its separate `ScreenerCandidate` authority boundary |

## 3. EXPLICIT STATEMENTS

1. This act **resolves the previously identified GP-6 scope discrepancy.**
2. It **adopts the existing committed four-domain GP-6 framing.**
3. It **does not establish GP-6 itself.**
4. It **does not designate any individual contract.**
5. It **does not create contracts, DTOs, schemas, view models, or code.**
6. It **does not authorize persistence implementation.**
7. It **does not authorize payload implementation.**
8. It **does not authorize transport implementation.**
9. It **does not open GATE-Y.**
10. It **does not resolve D115.**
11. It **does not authorize production.**
12. It **does not select technology, database, provider, or hosting.**
13. **Historical records are preserved and not edited.**
14. **Any later GP-6 contract designation requires a separate authority action.**

## 4. DISCREPANCY RESOLUTION — BASIS IN COMMITTED RECORDS

The scope discrepancy was between a four-domain and a six-domain reading of GP-6. RAMKI has
selected the four-domain scope, which is the framing already carried by the committed records:

| Committed record | Recorded framing |
| --- | --- |
| `GP-1-PERSISTENCE-GOVERNANCE-AUTHORITY-ACT.md` | `GP-6 \| Contract designation for the four domains \| NOT AUTHORIZED BY THIS ACT` |
| `GATE-P-POST-INVESTIGATION-AUTHORITY-DECISION-PACKET.md` | `GP-6 \| Contract designation for the four domains \| NOT FOUND` — Watchlists, Reports, Collaboration, Settings have no contract, DTO, or view model |
| `GATE-P-...-INVESTIGATION-FINDINGS.md` | `GP-6 \| Four of six domains have no contract, DTO, or view model` |

The two excluded domains are excluded on the basis of their own committed findings rows:

| ID | Committed finding | Consequence for GP-6 |
| --- | --- | --- |
| P-A | `NOT FOUND` on every axis | Prerequisite / boundary, not a contract-designation subject |
| P-F | `ScreenerCandidate` PRESENT · `AUTHORITY UNPROVEN` | A structure exists; its authority question is governed separately |

No historical record was edited to achieve this alignment. The resolution is additive.

## 5. AUTHORITY STATES — PRESERVED

| Gate | State |
| --- | --- |
| `GP-1` | **ESTABLISHED** |
| `GP-2` | **ESTABLISHED** |
| `GP-3` | **NOT AUTHORIZED** |
| `GP-4` | **UNRESOLVED / BLOCKED** |
| `GP-5` | **ESTABLISHED** |
| `GP-6` | **NOT AUTHORIZED** — scope is now designated; the authority itself is not established |

| Authority | State |
| --- | --- |
| `GP-6_CONTRACT_DESIGNATION_AUTHORITY` | **NOT ESTABLISHED** |
| `IMPLEMENTATION_AUTHORITY` | **NOT GRANTED** |
| `PERSISTENCE_IMPLEMENTATION_AUTHORITY` | **NOT GRANTED** |
| `PAYLOAD_DATA_AUTHORITY` | **NOT GRANTED** |
| `TRANSPORT_AUTHORITY` | **NOT GRANTED** |
| `STORAGE_PROVISIONING_AUTHORITY` | **NOT GRANTED** |
| `HOSTING_AUTHORITY` | **NOT GRANTED** |
| `D115_IDENTITY_AUTHORITY` | **UNCHANGED** — WITHHELD / UNRESOLVED / NOT AUTHORIZED |
| `PRODUCTION_AUTHORITY` | **UNCHANGED** — `productionEligible: false` |
| `GATE-Y` | **NOT SELECTED / NOT OPENED** |

| Item | State |
| --- | --- |
| M-1 | **DESIGNATED** — durable / transactional / application-owned relational, provider-neutral |
| M-2 | **DESIGNATED** — P-A through P-F |
| M-3 | **DESIGNATED** — durable, transactional, explicit ownership, governed retention |
| M-4 | **BLOCKED / DEPENDENT ON D115 + runtimeCompanyId** |
| M-5 | **GP-5 — ESTABLISHED** |
| M-6 | **GP-3 — NOT AUTHORIZED** |

Note on M-2 versus GP-6 scope: M-2 designates the persistence domain scope as P-A through P-F.
GP-6 scope is narrower by RAMKI's selection and governs **contract designation only**. These are
distinct questions and both statements stand without conflict.

## 6. PRESERVATION

No existing record was modified. `A-1`, the GATE-P selection record, the GATE-P findings record,
the post-GATE-P authority packet, `GP-1`, all three `GP-2` records, the RAMKI Determination Act,
both `GP-5` records, the D8 historical position, and all frozen qualification, certification, and
release records remain byte-identical. No source, test, configuration, deployment, runtime,
package-manifest, infrastructure, or contract file was touched. This act is purely additive.

```text
D8_REPOSITORY_TOKEN               = NOT FOUND
D8_HISTORICAL_GOVERNANCE_REFERENT = AUTHORITY-ASSERTED / EXTERNAL
D8_TRACEABLE_REPOSITORY_EVIDENCE  = NOT ESTABLISHED
D8_IMPLEMENTATION_AUTHORITY       = NOT ESTABLISHED BY A-1
```

## 7. NEXT AUTHORITY ACTION (not authorized by this act)

An explicit RAMKI act establishing GP-6 contract-designation authority, and thereafter a separate
authority action for each per-domain contract designation within P-B, P-C, P-D, P-E. Until then
GP-6 remains NOT AUTHORIZED and no contract, DTO, schema, view model, or code may be created.

---

**End of Scope Designation Act. Scope only. GP-6 NOT ESTABLISHED. No implementation authorized, performed, or implied.**
