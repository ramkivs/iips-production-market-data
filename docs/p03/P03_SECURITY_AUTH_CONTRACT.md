# P03 — SECURITY / AUTHORIZATION CONTRACT

**SPECIFICATION ONLY.** Satisfies tracker `P03-02` (*"Access-control contract"*, deps
`P01-05, P03-01`).

---

## 1. Seven distinct concerns — never conflated

The single most common failure in this area is collapsing these. The contract keeps all seven
separate, with separate owners and separate failure modes.

| # | Concern | Question it answers | Owner |
|---|---|---|---|
| S1 | **Authentication** | *Who is calling?* | **P03** (⚠ M-5) |
| S2 | **Authorization** | *May this caller perform this operation?* | **P03** |
| S3 | **Entitlement** | *Is this data licensed for this use?* | **P02 model · P03 enforcement** |
| S4 | **Tenant isolation** | *Whose data boundary is this?* | **P03** |
| S5 | **Credential/secret handling** | *How does the adapter prove itself to the provider?* | **P03** |
| S6 | **Provider access** | *How is the provider reached, securely?* | **P03 boundary · P05 runtime** |
| S7 | **Data identity** | *What instrument is this about?* | **P04 — NOT a security concern** |

| # | Rule |
|---|---|
| SD-1 | **Authentication ≠ authorization.** A valid principal is not an authorized one |
| SD-2 | **Authorization ≠ entitlement.** Our permission to ask is not a licence to hold the data |
| SD-3 | **Entitlement ≠ tenant scope.** A licensed dataset may still be out of a tenant's boundary |
| SD-4 | **Security principal ≠ data identity.** Merging S1/S4 with S7 would breach AD-1 |
| SD-5 | **Credential validity ≠ entitlement.** A working credential proves nothing about licensing |
| SD-6 | Each concern fails **independently and distinguishably** |

---

## 2. The access decision

Every data-plane request passes an ordered, **all-must-pass** gate chain. Order matters: the
earliest gate that denies is the one recorded.

| Order | Gate | Owner | Denial |
|---|---|---|---|
| G1 | **Authentication** — principal established | P03 | `UNAUTHENTICATED` |
| G2 | **Tenant context** — resolved, single, explicit | P03 | `TENANT_BOUNDARY_VIOLATION` |
| G3 | **Authorization** — principal may perform the operation in that tenant | P03 | `UNAUTHORIZED` |
| G4 | **Capability** — request within the adapter's declared capability | P02 | `UNSUPPORTED_CAPABILITY` (E6) |
| G5 | **Entitlement** — data licensed for this tenant/mode/environment | P02 model, P03 enforcement | `ENTITLEMENT_FAILURE` (E3) |
| G6 | **Credential availability** — adapter credential resolvable and valid | P03 | `CONFIGURATION_FAILURE` / `AUTHENTICATION_FAILURE` (E2) |
| G7 | Provider acquisition | P05 | E1/E4/E5/E7 |

| # | Rule |
|---|---|
| GD-1 | **All gates are evaluated before any provider call** except G7 |
| GD-2 | **Fail-closed at every gate.** Absent, expired, ambiguous or unevaluable ⇒ **deny** |
| GD-3 | **No gate may be skipped, cached past its validity, or inferred from a prior success** |
| GD-4 | A denial yields **no data, no partial data, no cached substitute, no degraded approximation** |
| GD-5 | Every decision — allow **and** deny — is **evidence-bearing** (NFR-07) |
| GD-6 | A later gate's success **never** compensates for an earlier gate's absence |

---

## 3. Authorization model requirements

| # | Requirement |
|---|---|
| AZ-1 | Authorization is evaluated over: **principal**, **tenant**, **operation**, **resource scope** (domain/dataset/field class), **mode** (LIVE/SNAPSHOT/PIT), **environment** |
| AZ-2 | **Default deny.** Absence of a grant is a denial, never a permission |
| AZ-3 | Grants are **explicit, enumerable and auditable**; implicit or wildcard-by-default grants are prohibited |
| AZ-4 | Authorization is **server-side only**. Client-side enforcement is not enforcement (`D4_09_P12_CONTRACT_DELTA.md` K.2.6) |
| AZ-5 | Authorization state is **never inferred from a successful provider response** |
| AZ-6 | Read/write asymmetry is explicit; this program's data plane is read-oriented, and any write path requires its own grant |
| AZ-7 | Administrative operations (provider configuration, entitlement records) require **separate** grants from data access |
| AZ-8 | ⚠ **The role/permission taxonomy itself is an open A1 content decision** — `P03_OPEN_ITEMS.md` OD-2 |

## 4. Enforcement point

| # | Rule |
|---|---|
| EP-1 | Enforcement is at the **data-plane boundary, server-side**, before the adapter is invoked |
| EP-2 | There is **exactly one** enforcement path; a second bypass path is prohibited — mirroring AD-2's single-ingress discipline |
| EP-3 | Adapters **do not make authorization decisions.** They receive an already-authorized, tenant-scoped, entitlement-checked request |
| EP-4 | An adapter reached without a completed decision chain is a **contract violation**, not a degraded state |
| EP-5 | Enforcement **must not** be placed in DTOs, UI or client bundles |

## 5. Relationship to the P01 contract

| # | Rule |
|---|---|
| PC-1 | **No security element becomes a canonical field.** No principal, role, token, credential, session or tenant secret in `fields` |
| PC-2 | The **only** contract-visible authorization outcome is `availability = WITHHELD` + `entitlementRef` |
| PC-3 | `entitlementRef` references the **entitlement requirement record**, never a credential |
| PC-4 | Tenant context may appear in **governed lineage** where AD-11 classification requires (`tenantId`), never in the canonical field space |
| PC-5 | The P01 snapshot identity `data-${provider}-${dataVersion}-${asOf}` is **unchanged**; no security element enters it |

## 6. Interaction with AD-11 governance

| # | Rule |
|---|---|
| GV-1 | `DataGovernanceRuntime.classify()` and `canAccess()` tenant isolation are **REUSED, not rebuilt** (AD-11) |
| GV-2 | Classification (`public`/`internal`/`confidential`/`restricted`), `region` and `tenantId` are recorded in lineage where applicable |
| GV-3 | **Classification is not authorization**; both apply independently |
| GV-4 | ⚠ **M-6:** `isWithinRetention()` is a stub — retention is **NOT enforced**. Recording a retention period is not an enforcement claim. **Not repaired here** |

## 7. ⚠ M-5 exposure on this contract

| Element | M-5 exposure |
|---|---|
| G1 authentication | **DIRECT** — no wired substrate exists to establish a principal |
| G2 tenant context | **DIRECT** — tenant identity conventionally derives from an authenticated session |
| G3 authorization | **DIRECT** — a grant is meaningless without a trustworthy principal |
| G4 capability | None — P02, principal-independent |
| G5 entitlement | **INDIRECT** — tenant-scoped entitlement inherits G2's exposure |
| G6 credential availability | **PARTIAL** — service-to-provider credentials are separable from user authentication |

| # | Rule |
|---|---|
| M5-1 | **P03 does not repair M-5** and must not alter existing-IIPS authentication |
| M5-2 | **No requirement here may be read as an assertion that authentication currently works** |
| M5-3 | Requirements with DIRECT exposure are **specifiable but not satisfiable** until M-5 is repaired by its existing-IIPS owner |
| M5-4 | This is **why C12 remains BLOCKED** (`D4_11_CERTIFICATION_MATRIX.md:50`). **P03 specification does not unblock it** |
| M5-5 | The correct posture is **fail-closed**: with no trustworthy principal, the chain denies. A design that "works" without authentication would be the defect |
