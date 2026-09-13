# P03 — AUTHENTICATION MODEL

**SPECIFICATION ONLY — NOT IMPLEMENTED.**

> ⚠ **M-5 is OPEN.** Authentication/session is **Missing** and enforcement **Not wired** in the
> existing platform (`docs/v3.0/PROGRAM_v3.0_G3_IDENTITY_TENANT_BOUNDARY.md` §5, cited at
> `docs/d4/D4_01_INTEGRATION_REUSE_BASELINE.md:240`).
> **This model does not repair M-5, does not alter existing-IIPS authentication, and does not
> assume any existing substrate works.**

---

## 1. Two authentication planes — kept separate

| Plane | Establishes | Direction | M-5 exposure |
|---|---|---|---|
| **AP-1 — Caller authentication** | Which principal is requesting data from us | Inbound | **DIRECT** |
| **AP-2 — Service-to-provider authentication** | That our adapter is who the provider expects | Outbound | **Indirect** — separable from AP-1 |

| # | Rule |
|---|---|
| AP-R1 | The two planes are **never conflated**. A provider credential is not a caller identity, and a caller identity is never forwarded to a provider |
| AP-R2 | **No caller credential, token or session ever reaches a provider** |
| AP-R3 | **No provider credential ever reaches a caller**, a DTO, a UI or a canonical payload |
| AP-R4 | AP-2 may be specified and later implemented **independently** of M-5's repair; AP-1 cannot |

---

## 2. AP-1 — Caller authentication requirements

| # | Requirement |
|---|---|
| CA-1 | Every data-plane request carries an **authenticated principal**. An unauthenticated request is denied at G1 |
| CA-2 | The principal is established **server-side**. A client-asserted identity is **not** an authenticated identity |
| CA-3 | The principal is **explicit** in the request context — never ambient, never defaulted, never "system" by omission |
| CA-4 | Principal establishment is **bounded in time**; expiry is enforced, not advisory |
| CA-5 | The principal type is distinguished: **human user**, **service principal**, **administrative principal** — with separate grant sets |
| CA-6 | Authentication yields a principal **and** a tenant context (see `P03_TENANT_ISOLATION.md`); a principal without a resolved tenant is **denied** |
| CA-7 | **No anonymous fallback.** There is no unauthenticated read path to production market data |
| CA-8 | **No shared or generic principal** may be used to represent multiple real actors — it destroys attribution |
| CA-9 | Authentication failure is `UNAUTHENTICATED` — **distinct** from `UNAUTHORIZED` |
| CA-10 | The authentication **mechanism** is an open A1 content decision — `P03_OPEN_ITEMS.md` OD-1 |

### 2.1 What is deliberately NOT specified

| Not specified | Why |
|---|---|
| Authentication protocol/scheme | Open A1 content decision (OD-1) |
| Session representation and lifetime values | OD-1 |
| Identity provider, directory or vendor | **No authoritative evidence requires one** — AC-4 |
| Role/permission taxonomy | Open A1 content decision (OD-2) |
| Any repair of the existing substrate | **M-5, existing-IIPS** |

**These are recorded as open, not resolved by inference.**

## 3. AP-2 — Service-to-provider authentication requirements

| # | Requirement |
|---|---|
| SP-1 | An adapter authenticates to a provider using a credential **resolved at call time** from the secret boundary — never a compiled-in, committed or cached-to-disk value |
| SP-2 | The credential is **scoped to one provider** and, where tenancy demands, to one tenant boundary |
| SP-3 | The credential **never enters** the canonical payload, lineage, audit record, error message, log or DTO |
| SP-4 | Credential resolution failure is `CONFIGURATION_FAILURE`; provider rejection of a resolved credential is `AUTHENTICATION_FAILURE` (E2) — **distinct conditions** |
| SP-5 | An E2 is **never retried** (deterministic failure) and **never** degraded to `quality: 'unavailable'` |
| SP-6 | An E2 is **never** reported as an entitlement failure (E3), nor the reverse — different owners, different remedies |
| SP-7 | Credential material is **held in memory for the minimum necessary duration** and never persisted by the adapter |
| SP-8 | Provider-side identity (account, subscription) is **provider-native detail** and stays inside the adapter per P02 M-1 |

## 4. Principal propagation

| # | Rule |
|---|---|
| PP-1 | The principal and tenant travel in an **explicit request context**, not in the canonical data |
| PP-2 | The context is available to the enforcement point; **the adapter receives an already-authorized request** and makes no decision (P02/P03 EP-3) |
| PP-3 | The principal **may** be recorded in the **audit record**; it **must not** be recorded in snapshot lineage as though it were data provenance — *who asked* is not *where the data came from* |
| PP-4 | The principal **never** participates in `snapshotId` or in effective replay identity. Two identical requests by different principals must yield **identical** data identity |
| PP-5 | ⚠ Consequence of PP-4: caller identity is **not** a cache key for data, and must not be used to vary returned data other than through the authorization/entitlement/tenant gates |

## 5. Failure behaviour

| Condition | Class | Retry? | Quality impact |
|---|---|---|---|
| No principal presented | `UNAUTHENTICATED` | No | **None — rejection** |
| Principal expired | `UNAUTHENTICATED` (distinguishable from never-presented) | No | Rejection |
| Principal valid, grant absent | `UNAUTHORIZED` | No | Rejection |
| Tenant context unresolvable | `TENANT_BOUNDARY_VIOLATION` | No | Rejection |
| Provider credential unresolvable | `CONFIGURATION_FAILURE` | No | Rejection |
| Provider rejected our credential | **E2** `AUTHENTICATION_FAILURE` | **No** | Rejection |
| Provider says not licensed | **E3** `ENTITLEMENT_FAILURE` | No | Rejection (or partial `WITHHELD`) |

| # | Rule |
|---|---|
| FB-1 | **Every one of these is fail-closed.** None produces data |
| FB-2 | **None** may be expressed as `quality: 'good'`, `'partial'`, `'stale'` or `'unavailable'` — they are contract conditions, not data conditions |
| FB-3 | Failures are **distinguishable in the audit record**; collapsing them destroys the diagnosis |
| FB-4 | Error responses **must not** disclose whether a principal exists, which grant is missing, or any credential detail |

## 6. M-5 limitation statement — carried explicitly

| # | Statement |
|---|---|
| M5-1 | **M-5 is OPEN.** Owner: **existing-IIPS**. This program is prohibited from repairing it (`docs/d7/D7_BLOCKER_MATRIX.md:143`) |
| M5-2 | **AP-1 is specifiable but not satisfiable today.** No wired substrate exists to establish a principal |
| M5-3 | Every AP-1 requirement above is written **as a requirement on a future substrate**, not as a description of current behaviour |
| M5-4 | **AP-2 is separable** and does not depend on M-5's repair |
| M5-5 | M-5's resolution **removes a blocker; it does not by itself authorize implementation** (`D7_BLOCKER_MATRIX.md:147`) |
| M5-6 | ⚠ **C12** data-plane security/tenant enforcement remains **BLOCKED** on M-5. **This specification does not unblock it** |
| M5-7 | Until M-5 is repaired, the correct system behaviour is **denial**. A path that serves production market data without authentication would be a defect, not a feature |
