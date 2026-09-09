# P03 — TENANT ISOLATION

**SPECIFICATION ONLY.** Satisfies tracker `P03-02` (*"Enforce tenant and role boundaries for
data access"*; acceptance *"Unauthorized access denied"*).

---

## 1. Tenant context

| # | Requirement |
|---|---|
| TC-1 | Every data-plane request carries **exactly one** resolved tenant context |
| TC-2 | Tenant context is **derived server-side** from the authenticated principal — **never** client-asserted, never taken from a request parameter, header or body the caller controls |
| TC-3 | A request with **no** resolvable tenant is **denied**. There is no default, fallback, "global" or "system" tenant for data access |
| TC-4 | A request resolving to **more than one** tenant is **denied** — ambiguity is a boundary violation, not a merge instruction |
| TC-5 | Tenant context is **explicit** throughout the request path, never ambient or thread-implicit |
| TC-6 | Tenant context is immutable for the life of a request; **re-scoping mid-request is prohibited** |
| TC-7 | ⚠ Tenant context derives from authentication ⇒ **DIRECT M-5 exposure** |

## 2. The four isolation guarantees

| # | Guarantee | Prohibition |
|---|---|---|
| **IS-1** | **No cross-tenant credentials** | A credential scoped to tenant A is never resolvable, reusable or substitutable in tenant B's request path |
| **IS-2** | **No cross-tenant data access** | Data acquired under tenant A is never served to, cached for, or reachable by tenant B |
| **IS-3** | **No cross-tenant lineage contamination** | A lineage or audit record must never expose another tenant's identity, entitlement, provider account or dataset reference |
| **IS-4** | **No accidental sharing of provider entitlements** | An entitlement granted for tenant A confers nothing on tenant B, even for the same provider, dataset and field set |

### 2.1 IS-1 — credential isolation

| # | Rule |
|---|---|
| C-1 | Credential resolution is **tenant-scoped where the provider relationship is tenant-specific** |
| C-2 | A shared service credential is permissible **only** where the provider relationship is genuinely program-level, and then it **confers no entitlement** on any tenant — G5 still applies per tenant |
| C-3 | A tenant may **never** cause another tenant's credential to be resolved, exercised, rotated or revoked |
| C-4 | Credential scope is **recorded**; an unscoped credential is a configuration defect |

### 2.2 IS-2 — data isolation

| # | Rule |
|---|---|
| D-1 | Every data access is evaluated against the tenant boundary **before** acquisition |
| D-2 | **Any cache, store or reuse of acquired data is tenant-partitioned.** A cache key without tenant scope is a boundary violation |
| D-3 | ⚠ **Interaction with P01 determinism:** identical `(provider, dataVersion, asOf)` yields an identical `snapshotId` **across tenants** — data identity is tenant-independent by design (P01 D-1, `P03_AUTHENTICATION_MODEL.md` PP-4). **Identity sharing must never become data sharing.** Tenant isolation is enforced at **access**, not by fragmenting identity |
| D-4 | D-3 is a **hard design constraint**: an implementation that keys storage solely by `snapshotId` without a tenant access check would leak across tenants while appearing correct |
| D-5 | Derived values, aggregates and reports inherit the tenant boundary of **every** contributing input |
| D-6 | Alternative and licensed data (D06, D09) additionally respect AD-11 `canAccess()` tenant isolation — **REUSED, not rebuilt** |

### 2.3 IS-3 — lineage and audit isolation

| # | Rule |
|---|---|
| L-1 | Lineage may record `tenantId` where AD-11 classification requires it; it must **never** record another tenant's identity |
| L-2 | A multi-tenant-visible artifact (a shared reference dataset) must not carry tenant-specific entitlement or account references |
| L-3 | Audit records are **tenant-partitioned for read**; a tenant may not read another tenant's audit trail |
| L-4 | Error messages must not disclose the existence, name or configuration of another tenant |
| L-5 | Aggregate metrics exposed to a tenant must not be derivable into another tenant's activity |

### 2.4 IS-4 — entitlement isolation

| # | Rule |
|---|---|
| E-1 | Entitlements are **granted per tenant**; they do not transfer, inherit or cascade between tenants |
| E-2 | A provider relationship shared at program level does **not** imply a shared entitlement |
| E-3 | Entitlement evaluation (G5) is performed **in the requesting tenant's context**, every time |
| E-4 | An entitlement grant to a parent organisational unit does not imply grants to sub-units unless **explicitly** enumerated — **no implicit inheritance** |
| E-5 | Cross-tenant entitlement reuse is a **boundary violation**, not an optimisation |

## 3. Region and data-residency

| # | Rule |
|---|---|
| RG-1 | AD-11 classification carries `region`; region constraints are evaluated alongside tenancy |
| RG-2 | A region constraint may deny access that tenancy alone would allow — the constraints are **conjunctive** |
| RG-3 | Region requirements for the production program are an **open decision** (`P03_OPEN_ITEMS.md` OD-5) |

## 4. Enforcement

| # | Rule |
|---|---|
| EN-1 | Enforcement is **server-side, at the data-plane boundary** (`D4_09_P12_CONTRACT_DELTA.md` K.2.6: *"Tenant scoping: server-enforced on every data endpoint"*) |
| EN-2 | **Every** data endpoint enforces; a single unenforced endpoint defeats the boundary |
| EN-3 | Adapters do **not** enforce tenancy — they receive an already tenant-scoped request |
| EN-4 | Enforcement is **fail-closed**: unresolvable, ambiguous or unevaluable tenancy ⇒ deny |
| EN-5 | A `TENANT_BOUNDARY_VIOLATION` is a **contract condition**, never a quality state, and is never retried |

## 5. ⚠ M-5 exposure and the C12 consequence

| # | Statement |
|---|---|
| M5-1 | Tenant context derives from an authenticated principal. With **M-5 OPEN**, tenant isolation is **specifiable but not satisfiable** |
| M5-2 | **P03 does not repair M-5.** Existing-IIPS owns it |
| M5-3 | `DataGovernanceRuntime.canAccess()` exists (AD-11) but its input — a trustworthy tenant context — does not yet exist. **Reusing the mechanism does not supply the missing input** |
| M5-4 | ⚠ **C12** data-plane security/tenant enforcement is recorded **BLOCKED** in `D4_11_CERTIFICATION_MATRIX.md:50` precisely for this reason. **This specification does not unblock C12** |
| M5-5 | Correct behaviour until M-5 is repaired: **deny**. Any tenant-scoped read that appears to work today should be treated as unverified, not as evidence of isolation |
