# P03 — SCOPE AND BOUNDARY

**Phase:** P03 — Secrets/Security (tracker: *Secrets, Security & Tenant Controls*)
**Status:** **WORK PACKAGE PREPARED — AWAITING REVIEW. NOT ACCEPTED.**
**Entry:** authority-unblocked per D8; upstream P01 ✅ and P02 ✅ accepted
**Certification:** `NONE_GRANTED` · **Production activation:** `NOT_AUTHORIZED`

> **SPECIFICATION / DESIGN ONLY. Nothing in this package is implemented.**
> No secret, credential, key, token, endpoint or account appears anywhere in it.

---

## 1. Authority-state reconciliation (read this first)

D4/D5/D7 record **"P03 BLOCKED — AUTHORITY."** **That state was superseded by D8 and is not
carried forward here.**

| Source | State | Standing |
|---|---|---|
| `docs/d4/D4_12_PHASE_SEQUENCE.md:27` | P03 `BLOCKED — AUTHORITY`; A1 UNKNOWN | **SUPERSEDED** |
| `docs/d5/E-01_SECURITY_IDENTITY_AUTHORITY.md:11` | A1 `OPEN — AUTHORITY UNKNOWN` | **SUPERSEDED** |
| `docs/d7/D7_AUTHORITY_ROLE_ASSIGNMENT.md:84` | A1 **UNKNOWN** | **SUPERSEDED** |
| **`docs/d8/D8_AUTHORITY_RECONCILIATION.md` §D, §E** | **A1 `PROGRAM-AUTHORITY CLEARANCE ESTABLISHED`; P03 "UNBLOCKED (authority)"** | **CURRENT** |
| **`docs/d8/D8_STATUS.json` `authority_status.A1`** | `PROGRAM_AUTHORITY_CLEARANCE_ESTABLISHED`, `person_named: false` | **CURRENT** |

**A1 is cleared, not named.** D8 states the blocker was *"there is no one to ask"*, and that
this is what clearance removed. **No individual is assigned to A1 by this package**, and none is
inferred from commit authorship, artifact ownership or repository activity.

**Consequence for P03:** the phase may be *specified*. Any **substantive security/identity
content decision** still requires a recorded A1 decision (see `P03_OPEN_ITEMS.md`).

---

## 2. What P03 owns

| # | Owned |
|---|---|
| O-1 | The **security/authentication boundary requirements** for the production market-data program |
| O-2 | **Credential and secret handling requirements** — lifecycle, separation, rotation, revocation, non-persistence |
| O-3 | **Configuration and environment separation** requirements |
| O-4 | **Tenant isolation** requirements for data-plane access |
| O-5 | **Authorization/entitlement enforcement** *mechanics* — where P02 defined the entitlement *model*, P03 defines how a decision is obtained and enforced |
| O-6 | **Provider-access security**: how credentials reach an adapter without entering canonical payloads |
| O-7 | **Security audit and observability** requirements |
| O-8 | **Fail-closed behaviour** for every security-establishment failure |
| O-9 | Where security/tenant context belongs across request context, lineage, audit and identity |

## 3. What P03 explicitly does NOT own

| # | Not owned | Owner |
|---|---|---|
| N-1 | The canonical market-data contract | **P01 — ACCEPTED, unchanged** |
| N-2 | Provider adapter contract, capability model, error taxonomy, entitlement *model* | **P02 — ACCEPTED, unchanged** |
| N-3 | **Canonical security master and identity resolution** | **P04** |
| N-4 | **OI-08** cardinality · **OI-09** identifier standard | **P04 / A1 content decision** |
| N-5 | Acquisition, normalization, data quality, PIT, replay | P05–P08 |
| N-6 | Engine integration, APIs, UI | P11–P13 |
| N-7 | Provider selection, licensing, commercial terms, production onboarding | P16 |
| N-8 | Monitoring stacks, alerting, incident response | P17 |
| N-9 | **Repair of M-5** — existing-IIPS authentication/session | **Existing-IIPS** |
| N-10 | Certification of anything (C1–C12) | **A2 — Implementation / Certification Authority** (see §3.1) |
| N-11 | Product-wide security identity authority | **Not granted to P03** — §5 |

### 3.1 Certification authority — historical D4 wording vs current D8 state

`D4_11_CERTIFICATION_MATRIX.md` records the certification authority for C1–C12 as
**"UNKNOWN"**. **That wording is historical and is quoted, not adopted, wherever it appears in
this package.** The current state is:

| Layer | Current record | Source |
|---|---|---|
| **A2 role** | Implementation / Certification Authority | `D8_STATUS.json` `authority_status.A2` |
| **A2 status** | **`PROGRAM_AUTHORITY_CLEARANCE_ESTABLISHED`** | same |
| **A2 person** | **`person_named: false`** — no individual named, and **none is inferred or assigned by this package** | same |
| **A2 certification granted** | **`certification_granted: false`** | same |
| **Program certification** | **`NONE_GRANTED`** — C1–C12 all ungranted; **C12 additionally BLOCKED** on M-5 | `D4_11:50`, `P03_OPEN_ITEMS.md` |

**This mirrors A1 exactly: clearance established, person not named.** Clearance is **not** a
grant of certification. **P03 neither grants nor implies certification of anything**, and P03's
specification does not unblock C12.

## 4. Relationships to the accepted phases

### 4.1 To P01 (canonical contract)

| # | Relationship |
|---|---|
| R1-1 | P03 **consumes** the P01 contract and changes nothing in it |
| R1-2 | Security context **never becomes a canonical field**. No credential, principal, token or tenant secret may appear in `fields` |
| R1-3 | The `WITHHELD` availability marker and `entitlementRef` are the **only** contract surface through which an authorization outcome is expressed |
| R1-4 | P01's four version axes are untouched |

### 4.2 To P02 (provider abstraction)

| # | Relationship |
|---|---|
| R2-1 | P02 defined **that** an entitlement decision occurs and how its outcome is represented (`P02_ENTITLEMENT_MODEL.md` SC-1/SC-2). **P03 defines how the decision is obtained and enforced** |
| R2-2 | P02's E1–E8 taxonomy is **reused, not extended** — see `P03_FAILURE_AND_DEGRADED_MODE.md` |
| R2-3 | P02's containment rule holds: credentials stay **outside** the canonical payload and provider-native detail stays **inside** the adapter |
| R2-4 | P02's observability redaction rules (RD-1…RD-6) are inherited verbatim |
| R2-5 | P02 explicitly did **not** presume a working auth substrate (SC-4). P03 must honour that |

### 4.3 To P04 (security master / identity)

| # | Relationship |
|---|---|
| R4-1 | **AD-1 preserved:** canonical identity is authoritative in the data plane; `companyId` is authoritative at the certified CSIP boundary |
| R4-2 | **P03 is not the identity authority.** Security principals (who is calling) and data identity (what the data is about) are **different identity spaces and must not be merged** |
| R4-3 | P03 must not resolve, alias or approximate canonical instrument identity |
| R4-4 | `identityMappingVersion` remains produced by P04 and passed through |
| R4-5 | **No identity-mapping methodology may be silently changed** |

### 4.4 To existing-IIPS

| # | Relationship |
|---|---|
| RE-1 | ⚠ **M-5 OPEN:** authentication/session is **Missing / Not wired** (`docs/v3.0/PROGRAM_v3.0_G3_IDENTITY_TENANT_BOUNDARY.md` §5, cited at `D4_01_INTEGRATION_REUSE_BASELINE.md:240`) |
| RE-2 | **P03 does not repair M-5** and must not alter existing-IIPS authentication implementation |
| RE-3 | P03 **must not assume the existing substrate works.** Every requirement that depends on it is marked with its M-5 exposure |
| RE-4 | Any integration must be **additive and governed** |
| RE-5 | Existing-IIPS methodology and certification authority remain **separate** |
| RE-6 | ⚠ **C12** (data-plane security/tenant enforcement) is recorded **BLOCKED** in `D4_11_CERTIFICATION_MATRIX.md:50` — *"M-5 auth not wired"*. **P03 specification does not unblock C12** |

---

## 5. The authority ceiling on P03

| # | Rule |
|---|---|
| AC-1 | P03 may **specify** a security boundary. It may **not** become the product-wide security identity authority |
| AC-2 | A1 clearance permits the work; it does **not** substitute for a recorded A1 **content** decision |
| AC-3 | Every substantive choice this package cannot make is recorded as an **open decision**, not resolved by inference (`P03_OPEN_ITEMS.md`) |
| AC-4 | **No vendor or secret-management product is selected** — no authoritative evidence requires one |
| AC-5 | Authority clearance ≠ implementation authorization ≠ certification ≠ gate acceptance |

## 5.1 Identifier namespace convention (package-wide)

**`AD-*` and `M-*` are RESERVED for program-level identifiers** (AD-1 identity boundary, AD-2
sole ingress, AD-4/E2E-030, AD-11 governance, AD-17 replay; M-1, M-5, M-6 blockers). **No P03
artifact defines a local rule in either namespace.** P03-local rule sets use distinct prefixes:

| Prefix | Meaning | Defined in |
|---|---|---|
| `GD-*` | **G**ate-**d**ecision rules for the G1–G7 chain | `P03_SECURITY_AUTH_CONTRACT.md` §2 |
| `SM-*` | Derivable **s**ecurity **m**etrics | `P03_AUDIT_AND_OBSERVABILITY.md` §4 |
| `PK-*` | **P**ac**k**age-integrity acceptance criteria | `P03_ACCEPTANCE_CRITERIA.md` §M |
| `M5-*` | Statements **about** program blocker M-5 (not a redefinition of it) | three artifacts, scoped per file |
| others | `O-*`, `N-*`, `R1-*`, `R2-*`, `R4-*`, `RE-*`, `AC-*`, `S*`, `SD-*`, `AZ-*`, `EP-*`, `PC-*`, `GV-*`, `AP-*`, `CA-*`, `SP-*`, `PP-*`, `FB-*`, `TC-*`, `IS-*`, `RG-*`, `EN-*`, `SL-*`, `CF-*`, `EV-*`, `NP-*`, `AS-*`, `FR-*`, `VO-*`, `DR-*`, `CD-*`, `EE-*`, `EA-*`, `PN-*`, `A-*`, `AU-*`, `TN-*`, `CR-*`, `PA-*`, `RJ-*`, `CC-*`, `RD-*`, `MQ-*`, `PB-*`, `RT-*`, `NC-*`, `FC-*`, `DM-*`, `CV-*`, `BC-*`, `T-*`, `SI-*`, `V-*`, `R-*`, `E-*`, `B-*`, `DEP-P03-*`, `OD-*`, `DO-*` | file-scoped |

**Rule NS-1:** a P03-local identifier is always read in the scope of the artifact that defines
it; a program-level identifier (`AD-*`, `M-*`, `OI-*`, `C*`, `E1`–`E8`, `NFR-*`, `ADR-*`) always
carries its program meaning, in every artifact. **This package changes no program-level
identifier's meaning.**

## 6. Design-only vs implementation

| Element | Status |
|---|---|
| Every requirement in this package | **DESIGN ONLY** |
| Executable security code, config, policy files | **NOT PRODUCED** |
| Secrets, credentials, endpoints | **NOT PRODUCED — prohibited** |
| Security tests, authz tests | **DEFERRED** — tracker `P03-01`/`P03-02` validation methods; see `P03_EVIDENCE.md` §3 |
| Tracker deliverables *"Secrets design"*, *"Access-control contract"* | **DELIVERED as specification** |

## 7. Gate position

P03 is **NOT accepted**. Gate: **P03 — Security gate**
(TRACKER `Phase Gates!P03`: *"Secure provider credentials, service identities, tenant isolation
and access controls"*). Gate rule: **"Explicit gate acceptance; no automatic promotion."**
