# P03 — SECURITY AUDIT AND OBSERVABILITY

**SPECIFICATION ONLY.** Extends P02's observability conventions to security events.
**P02's redaction rules RD-1…RD-6 are inherited verbatim and are not relaxed.**
**P17 owns operations** — monitoring stacks, dashboards, alerting and incident response are
neither designed nor implemented here.

---

## 1. Principles

| # | Rule |
|---|---|
| A-1 | **Every security decision is recorded — allows as well as denials.** Recording only failures makes normal access unauditable |
| A-2 | Records are **append-only in intent**; a correction is a new record |
| A-3 | A silently discarded security decision is itself a **contract violation** |
| A-4 | **No secret, credential, token, endpoint or account value is ever recorded** |
| A-5 | Records must be sufficient to answer *who, in which tenant, asked for what, under which grant, with what outcome, when* — without contacting a provider |
| A-6 | Security audit records are **internal governed artifacts**, never product DTOs |

## 2. Required event records

### 2.1 Authentication attempt (G1)

| # | Element |
|---|---|
| AU-1 | Principal reference (opaque, non-credential) or `NONE_PRESENTED` |
| AU-2 | Principal type — user / service / administrative |
| AU-3 | Outcome — authenticated / `UNAUTHENTICATED` (absent vs expired, distinguishably) |
| AU-4 | Timestamp (ISO-8601 UTC) |
| AU-5 | Environment |
| AU-6 | ⚠ **Never**: credential, token, session material, password state, or whether a principal exists |

### 2.2 Tenant resolution (G2)

| # | Element |
|---|---|
| TN-1 | Resolved `tenantId`, or `UNRESOLVED` / `AMBIGUOUS` |
| TN-2 | Outcome — resolved / `TENANT_BOUNDARY_VIOLATION` |
| TN-3 | ⚠ **Never**: any other tenant's identity (IS-3 L-4) |

### 2.3 Authorization decision (G3)

| # | Element |
|---|---|
| AZ-1 | Principal reference · `tenantId` · operation · resource scope · mode · environment |
| AZ-2 | Decision — **ALLOW or DENY, both recorded** |
| AZ-3 | Grant reference on allow; **denial reason class only** on deny |
| AZ-4 | ⚠ **Never**: which specific grant was missing (information disclosure) |

### 2.4 Entitlement decision (G5)

| # | Element |
|---|---|
| EN-1 | `tenantId` · provider identity (internal) · domain/dataset · field scope · mode · environment |
| EN-2 | Decision — allow / whole-request `E3` / partial with `WITHHELD` field count |
| EN-3 | `entitlementRef` — **the requirement record, never a credential** |
| EN-4 | Distinguish **never-entitled**, **expired** and **unevaluable** |

### 2.5 Credential resolution (G6)

| # | Element |
|---|---|
| CR-1 | Secret **reference** and its declared scope |
| CR-2 | Resolving service principal |
| CR-3 | Outcome — resolved / absent / expired / revoked / store-unreachable, **distinguishably** |
| CR-4 | ⚠ **Never**: the secret value, or any fragment, hash or prefix of it |

### 2.6 Provider access (G7)

| # | Element |
|---|---|
| PA-1 | Reuse P02 `P02_OBSERVABILITY_REQUIREMENTS.md` R-1…R-15 in full |
| PA-2 | Plus: `tenantId`, principal reference, entitlement decision reference |
| PA-3 | ⚠ **Never**: provider-native error strings, unredacted payloads, endpoints (P02 RD-3/RD-4) |

### 2.7 Rejection / failure

| # | Element |
|---|---|
| RJ-1 | Failure class — the P03 security classes or P02 E1–E8 |
| RJ-2 | Which **gate** denied (G1–G7) — the earliest denying gate |
| RJ-3 | Whether any snapshot was produced (for a security denial: **never**) |
| RJ-4 | Full request context per §2.3 |

### 2.8 Credential / configuration change

| # | Element |
|---|---|
| CC-1 | Change type — issue / rotate / expire / revoke / destroy / config-change |
| CC-2 | Secret or configuration **reference** and scope |
| CC-3 | Acting principal · timestamp · environment |
| CC-4 | ⚠ **Never**: old or new value |
| CC-5 | Revocation is recorded as effective-immediately, with its effective time |

### 2.9 Tenant context on every record

| # | Rule |
|---|---|
| TC-1 | Every record above carries the resolved `tenantId`, or an explicit unresolved marker |
| TC-2 | Records are **tenant-partitioned for read** (IS-3 L-3) |

## 3. Redaction — inherited and extended

| # | Prohibition |
|---|---|
| RD-1 | No credential, key, token, password or certificate — **in any form, including hashes, prefixes or lengths** |
| RD-2 | No endpoint, hostname, account identifier or subscription reference |
| RD-3 | No unredacted provider payload |
| RD-4 | No provider-native error string in a contract-level record |
| RD-5 | No vendor name where the internal `provider` identity suffices |
| RD-6 | No cross-tenant identity, configuration or activity |
| RD-7 | No disclosure of principal existence, grant composition or authentication mechanism detail in caller-visible errors |

## 4. Derivable security metrics

Stated as **derivable quantities**, not an implemented metrics system.

| # | Quantity |
|---|---|
| SM-1 | Authentication attempts and `UNAUTHENTICATED` outcomes |
| SM-2 | Authorization allows and denies, by operation class |
| SM-3 | Tenant-boundary violations — **any non-zero value warrants investigation** |
| SM-4 | Entitlement denials, split whole-request vs partial `WITHHELD` |
| SM-5 | Credential resolution failures by cause (absent / expired / revoked / store-unreachable) |
| SM-6 | E2 `AUTHENTICATION_FAILURE` counts against providers |
| SM-7 | Credential rotation and revocation events |
| SM-8 | Distribution of denials across gates G1–G7 |

| # | Rule |
|---|---|
| MQ-1 | P03 requires the **inputs** to exist and be unambiguous. It sets **no thresholds, no SLOs, no alerts** |
| MQ-2 | Alerting, dashboards and incident response are **P17** |

## 5. Product-surface boundary

| # | Rule |
|---|---|
| PB-1 | Security audit records are internal; they are **not** product DTOs |
| PB-2 | Provider identity never reaches product DTOs or UI (NFR-06) |
| PB-3 | A caller sees an honest denial **class**, never the internal reason detail |
| PB-4 | Degraded data state is surfaced honestly (`quality`, `WITHHELD`), never hidden — but a **security denial is not a data state** |
| PB-5 | What is surfaced is decided by **P12/P13** |

## 6. Retention

| # | Rule |
|---|---|
| RT-1 | Security audit retention is governed by the AD-11 classification regime |
| RT-2 | ⚠ **M-6:** `isWithinRetention()` is a stub — **retention is NOT enforced**. Recording a retention period is not an enforcement claim |
| RT-3 | **M-6 is not repaired here.** Any control depending on retention enforcement must be recorded as currently unenforceable |
| RT-4 | ⚠ Security audit records are, by nature, the records most likely to carry a retention obligation — so M-6's non-enforcement is a **material limitation** here, recorded in `P03_OPEN_ITEMS.md` |
