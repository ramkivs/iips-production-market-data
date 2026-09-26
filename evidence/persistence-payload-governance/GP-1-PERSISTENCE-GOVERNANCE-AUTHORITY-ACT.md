# Institutional Investment Platform System (IIPS)
# GP-1 — Persistence Governance Authority Act

**Governing Standards:** AD-01..AD-18 / AD-CHARTER-2026-01
**Authority Act ID:** `gp-1-persistence-governance-authority-2026-09-26-001`
**Governing Authority:** RAMKI (Authorizing Authority)
**Recording Agent:** Arena (recording only — no implementation performed or authorized by this act)
**Act Type:** PERSISTENCE GOVERNANCE AUTHORITY DESIGNATION
**Recorded At (local, Asia/Calcutta):** 2026-09-26
**Antecedent Checkpoint:** `645884dd8533000140c821b1481bad561e6c7432`

---

## 1. VERIFIED ANTECEDENT STATE (inspected before recording, not assumed)

| Item | Verified value |
| --- | --- |
| Authoritative remote | `origin` → `https://github.com/ramkivs/iips-production-market-data.git` (sole remote) |
| Authoritative branch | `refs/heads/main` @ `4d3e1cdca3a33da0ec3be8b336b17128108a502c` (UNCHANGED) |
| Workstream branch | `arena/01a0ddae-iips-production-market-data` |
| HEAD at recording | `645884dd8533000140c821b1481bad561e6c7432` |
| LOCAL == REMOTE before mutation | TRUE — `git ls-remote` and GitHub API agree (explicit refs; `@{u}` not used) |
| Worktree | CLEAN (0 entries) |
| Delta from baseline | 4 ADDs, all under `evidence/persistence-payload-governance/`; 0 modified; 0 deleted |

Antecedent records, unmodified by this act (sha256, first 16 hex):

| Record | Digest | Lines |
| --- | --- | --- |
| `A-1-PERSISTENCE-PAYLOAD-GOVERNANCE-WORKSTREAM-DESIGNATION.md` | `eec83ead90ff8f38` | 133 |
| `GATE-P-PERSISTENCE-GOVERNANCE-READ-ONLY-GATE-SELECTION.md` | `49cc63480cb5dba1` | 127 |
| `GATE-P-PERSISTENCE-GOVERNANCE-READ-ONLY-INVESTIGATION-FINDINGS.md` | `c0be2e817c8bd69c` | 218 |
| `GATE-P-POST-INVESTIGATION-AUTHORITY-DECISION-PACKET.md` | `a2ef385785357b4a` | 144 |

## 2. AUTHORITY PRECONDITIONS RE-PROVED

| Precondition | Verified state |
| --- | --- |
| GATE-P explicitly selected | YES — `SELECTED_READ_ONLY_GATE = Persistence Governance (GATE-P)` |
| GATE-P investigation complete | YES — `GATE_P_READ_ONLY_INVESTIGATION = COMPLETE` |
| GP-1 previously granted | NO — 0 acts of this type existed; every recorded `PERSISTENCE_AUTHORITY` value was a negative |
| GP-2 | NOT FOUND |
| GP-3 | BLOCKED / conditional |
| GP-4 | UNRESOLVED |
| GP-5 | NOT FOUND |
| GP-6 | NOT FOUND |
| D115 authority | UNCHANGED |
| Production authority | UNCHANGED |
| D8 | PRESERVED — four-line block semantically identical across all antecedent records |

The GATE-P selection act recorded `PERSISTENCE_AUTHORITY = NOT GRANTED unless separately
established`. **This act is that separate establishment**, and it is limited to governance.

## 3. AUTHORIZATION RECORDED (authority statement, verbatim)

> AUTHORIZING AUTHORITY: RAMKI
>
> AUTHORIZATION: Proceed with the next authority-governed step for GATE-P:
> GP-1 — Persistence Governance Authority.
>
> SCOPE: Establish a bounded persistence-governance authority act for the
> already-investigated Persistence Governance workstream.
>
> IMPORTANT: This authorization is LIMITED to GP-1 governance authority.

**Authorized by:** RAMKI. Arena did not select, widen, rank, or infer any part of this scope.

## 4. WHAT THIS ACT ESTABLISHES

`PERSISTENCE_GOVERNANCE_AUTHORITY` — the authority to govern and authorize the **bounded
persistence-governance decision process** arising from GATE-P.

Within that authority, and only within the persistence-governance scope already established by
A-1 §2 Scope A and investigated by GATE-P, the following are authorized:

| # | Authorized activity |
| --- | --- |
| 1 | Bounded persistence **governance** deliberation and decision preparation |
| 2 | Bounded persistence **planning** that produces governance records, not code |
| 3 | Authority-gated sequencing of subsequent persistence-governance decisions |
| 4 | Preparation of further authority packets for RAMKI determination |

The bounded scope remains exactly the six GATE-P domains: persistence foundation, Watchlists,
Reports, Collaboration, Settings, Governed Screener. No seventh domain is created.

## 5. AUTHORITY STATES — RECORDED SEPARATELY

| Authority | State |
| --- | --- |
| `PERSISTENCE_GOVERNANCE_AUTHORITY` | **ESTABLISHED BY THIS ACT** |
| `IMPLEMENTATION_AUTHORITY` | **NOT GRANTED** |
| `STORAGE_AUTHORITY` | **NOT GRANTED** |
| `PERSISTENCE_IMPLEMENTATION_AUTHORITY` | **NOT GRANTED** |
| `PAYLOAD_DATA_AUTHORITY` | **NOT GRANTED** |
| `TRANSPORT_AUTHORITY` | **NOT GRANTED** |
| `D115_IDENTITY_AUTHORITY` | **UNCHANGED** — WITHHELD / UNRESOLVED / NOT AUTHORIZED |
| `PRODUCTION_AUTHORITY` | **UNCHANGED** — `productionEligible: false` |

**Governance authority is not implementation authority.** The authority to decide how persistence
should be governed is not permission to build persistence.

## 6. GP-2 … GP-6 — EXPLICITLY NOT AUTHORIZED BY THIS ACT

| Id | Dependency | State after this act |
| --- | --- | --- |
| GP-2 | Storage target designation | **NOT AUTHORIZED BY THIS ACT** |
| GP-3 | Relief from PHASE5 §3 transport exclusions | **NOT AUTHORIZED BY THIS ACT** |
| GP-4 | D115 C/D + `runtimeCompanyId` | **UNRESOLVED / OUTSIDE THIS ACT** |
| GP-5 | Persistence tier / hosting authority | **NOT AUTHORIZED BY THIS ACT** |
| GP-6 | Contract designation for the four domains | **NOT AUTHORIZED BY THIS ACT** |

Each remains a separate authority requiring its own explicit RAMKI determination.

## 7. THIS ACT DOES NOT AUTHORIZE

- persistence implementation · database/storage implementation
- storage target selection unless separately authorized · persistence hosting selection
- payload-data authority · transport authority · relief from `PHASE5` §3 transport exclusions
- Watchlists / Reports / Collaboration / Settings implementation
- Governed Screener persistence implementation · Research/UI03 persistence implementation
- `FundamentalsDTO` or `IntelligenceDTO` transport implementation
- D115 C/D identity resolution · `runtimeCompanyId` assignment
- provider activation · Dhan/NSE activation · credentials or network activation
- production activation · production eligibility
- modification of frozen historical governance records
- opening GATE-Y, reopening GATE-P, or altering D8

## 8. PRESERVATION

No existing record was modified by this act. `A-1`, the GATE-P selection record, the GATE-P
findings record, the post-GATE-P authority packet, the D8 historical reconciliation position, and
all frozen qualification, certification, and release records remain byte-identical. This act is
purely additive and traceable to the antecedent checkpoint in §1.

## 9. D8 — PRESERVED / UNCHANGED

```text
D8_REPOSITORY_TOKEN               = NOT FOUND
D8_HISTORICAL_GOVERNANCE_REFERENT = AUTHORITY-ASSERTED / EXTERNAL
D8_TRACEABLE_REPOSITORY_EVIDENCE  = NOT ESTABLISHED
D8_IMPLEMENTATION_AUTHORITY       = NOT ESTABLISHED BY A-1
```

## 10. NEXT AUTHORITY GATE (not authorized by this act)

Persistence governance is now authorized; persistence itself is not. Any movement toward GP-2,
GP-3, GP-5, or GP-6 requires a separate explicit RAMKI determination. Arena must not select,
sequence, or begin any of them, and must not treat this act as permission to plan implementation.

---

**End of Authority Act. Persistence governance authority established. No implementation authorized, performed, or implied.**
