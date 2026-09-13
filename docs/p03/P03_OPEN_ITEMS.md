# P03 — OPEN ITEMS AND DEFERRED DECISIONS

**Recording an open item is NOT resolving it.** Nothing here is closed by this package.

---

## 1. Open decisions raised by P03 (require A1 content decisions)

⚠ A1 is **`PROGRAM_AUTHORITY_CLEARANCE_ESTABLISHED`** with **`person_named: false`**. Clearance
permits work to proceed; it is **not** a substantive content decision. **No person is assigned
or inferred.**

| ID | Open decision | Why P03 cannot decide it | Blocks P03 gate? | Blocks implementation? |
|---|---|---|---|---|
| **OD-1** | **Authentication mechanism / protocol / session model** | Requires an A1 architectural decision and interacts with existing-IIPS (M-5). No authoritative evidence prescribes one | **No** — requirements are written mechanism-neutrally | **YES** |
| **OD-2** | **Role / permission taxonomy** — the actual roles and grants | Product and authority decision; D4 records the requirement, not the taxonomy | **No** | **YES** |
| **OD-3** | **Rotation frequency, expiry and revocation SLAs** | Operational policy; P17 domain, needs A1/operations input | No | Partially |
| **OD-4** | **Tenant model** — the real tenant set, hierarchy and whether sub-units exist | Product decision. P03 specifies isolation *given* tenants | No | **YES** |
| **OD-5** | **Region / data-residency requirements** | AD-11 carries `region`; the required constraints are undefined | No | Partially |
| **OD-6** | **Secret-management substrate** | **No authoritative evidence requires a product**; selecting one would be invention | No | **YES** |
| **OD-7** | **Service-principal model** for credential resolution | Depends on OD-1 | No | **YES** |
| **OD-8** | **Human/break-glass access to production secret values** | Deliberately not designed; would require explicit authority and its own audit regime | No | Partially |
| **OD-9** | **Whether provider relationships are program-level or tenant-scoped** | Depends on P16 licensing, not yet performed. Both cases are specified conditionally | No | Partially |

## 2. Inherited open items — state UNCHANGED

| Item | State before P03 | State after P03 | P03 action |
|---|---|---|---|
| **A1 person assignment** | Cleared, `person_named: false` | **UNCHANGED** | None. Not inferred from commit authorship, artifact ownership or repository activity |
| **M-5** authentication not wired | **OPEN — existing-IIPS** | **OPEN — UNCHANGED** | Carried explicitly throughout. **Not repaired** |
| **M-6** retention stub | **OPEN — existing-IIPS** | **OPEN — UNCHANGED** | Recorded as a material limitation on security audit retention. **Not repaired** |
| **M-1 / AD-4** E2E-030 | `OPEN_REVALIDATION_REQUIRED` | **UNCHANGED** | E2E-030 **NOT REVOKED, NOT RENEWED** |
| **AD-17** replay literal returns | **UNRESOLVED** | **UNRESOLVED** | `ReplayService` untouched |
| **OI-08** cardinality 1→N | OPEN | **UNCHANGED** | **P04.** Not touched |
| **OI-09** identifier standard | OPEN | **UNCHANGED** | **P04.** Not touched |
| **OI-10** namespace token | `APPROVED-BUT-REQUIRES-EXACT-TOKEN-RECORDING` | **UNCHANGED** | No token invented; no canonical field added |
| **OI-05** alt-data applicability | OPEN | **UNCHANGED** | Noted for D09 entitlement scope only |
| **OI-06 / CD-01 / AD-9** | OPEN | **UNCHANGED** | No P03 impact |
| **C1–C12 certification** | `NONE_GRANTED` | **UNCHANGED** | **C12 remains BLOCKED**; C5 remains ungranted. Authority is **A2** — `PROGRAM_AUTHORITY_CLEARANCE_ESTABLISHED`, `person_named: false`, `certification_granted: false` (`D8_STATUS.json`). D4's *"authority UNKNOWN"* wording is **historical**; see `P03_SCOPE_AND_BOUNDARY.md` §3.1. **No individual named or inferred** |

## 3. ⚠ M-5 — the defining limitation of this phase

| # | Statement | Source |
|---|---|---|
| M5-1 | Authentication/session is **Missing**; enforcement **Not wired** | `PROGRAM_v3.0_G3_IDENTITY_TENANT_BOUNDARY.md` §5, via `D4_01:240` |
| M5-2 | M-5 is **OPEN**, owner **existing-IIPS**, and its repair is **outside this program** | `D7_BLOCKER_MATRIX.md:143` |
| M5-3 | M-5 has **no `blocks` array** in `D8_STATUS.json`, and P03 carries **no `*`** prerequisite marker in `D8_EXECUTION_AUTHORIZATION.md` §1.1 ⇒ it is a **recorded limitation, not a P03 entry blocker** | D8 |
| M5-4 | Resolving M-5 **removes a blocker; it does not authorize implementation** | `D7_BLOCKER_MATRIX.md:147` |
| M5-5 | ⚠ **C12** — data-plane security/tenant enforcement — is **BLOCKED** on *"M-5 auth not wired"*. **P03 specification does not unblock C12** | `D4_11_CERTIFICATION_MATRIX.md:50` |
| M5-6 | Consequence: **AP-1, G1, G2 and G3 are specifiable but not satisfiable.** Every such requirement is written as a requirement on a future substrate | This package |
| M5-7 | Correct behaviour meanwhile is **denial**. A path serving production market data without authentication is a defect, not resilience | This package |

## 4. Deferred obligations — recorded, not silently implemented

| ID | Obligation | Tracker origin | Deferred to | Why deferred |
|---|---|---|---|---|
| **DO-1** | Security tests for the secrets flow | `P03-01` validation *Security tests*; acceptance *"Secrets flow passes security checks"* | P05 + P15 | Specification-only phase; standing prohibition on implementation |
| **DO-2** | Authorization tests | `P03-02` validation *Authz tests*; acceptance *"Unauthorized access denied"* | P05 + P15 | Same |
| **DO-3** | Secret-scanning control in CI | `P03_SECRET_CONFIGURATION_REQUIREMENTS.md` VO-1 | Implementation phase | Same |
| **DO-4** | Tenant-isolation verification evidence | C12 | P15 | **Blocked by M-5** |
| **DO-5** | Any policy, configuration or code artifact | — | Implementation phase | Standing prohibition |

**These are explicit deferred obligations, per the standing instruction to record rather than
silently implement when a prohibition applies.**

## 5. Correction owed elsewhere — NOT APPLIED

| Location | Stale statement | Correct state (D8) | Action |
|---|---|---|---|
| `docs/p02/P02_GATE_ACCEPTANCE.md` §5, §7 | P03 `BLOCKED — AUTHORITY`, citing D4_12 §N.2 | **UNBLOCKED (authority)**; M-5 is a limitation, not an entry blocker | ⚠ **Correction owed. NOT APPLIED** — outside this package's write scope (`docs/p03/` only) |
| `docs/p00/P00_GATE_MODEL.md` P03 row | `⚠ BLOCKED — A1 authority UNKNOWN` | Same | ⚠ **Correction owed. NOT APPLIED** |
| `docs/PROGRAM_STATE.md` | Current phase P03 `BLOCKED — AUTHORITY` | Same | ⚠ **Correction owed. NOT APPLIED** |

**No file outside `docs/p03/` has been modified by this package.** These corrections require
separate explicit authorization.

## 6. Items explicitly NOT resolved

| # | Not resolved |
|---|---|
| 1 | M-5, M-6, M-1/AD-4, AD-17 |
| 2 | OI-05, OI-06, OI-08, OI-09, OI-10, CD-01 |
| 3 | A1 person assignment |
| 4 | Any certification (C1–C12); C12 specifically remains BLOCKED |
| 5 | Production activation |
| 6 | Provider selection, licensing or onboarding |
| 7 | Any P04+ deliverable |
| 8 | The AD-14 tracker corrections |
| 9 | The three stale P03-blocker annotations in §5 |
