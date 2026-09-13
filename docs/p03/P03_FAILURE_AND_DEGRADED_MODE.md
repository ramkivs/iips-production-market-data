# P03 — FAILURE AND DEGRADED-MODE BEHAVIOUR

**SPECIFICATION ONLY.**

> **Inherited governing distinction:** a **contract or security condition** is a **rejection**;
> a **data condition** is a **quality state**.
> **No security failure may ever be laundered into a quality value.**

---

## 1. Relationship to the P02 taxonomy — no new classes for provider-side conditions

P02's E1–E8 taxonomy is **ACCEPTED and reused unchanged**. P03 adds **no** provider-side error
class. It defines four **pre-provider security conditions** that occur at gates P02 never
covered, because P02 explicitly excluded authentication, tenancy and credentials (SC-1/SC-2).

| Class | Gate | Justification for existing | Overlaps an E-class? |
|---|---|---|---|
| **`UNAUTHENTICATED`** | G1 | No principal established. P02 has no inbound-caller concept | **No** |
| **`UNAUTHORIZED`** | G3 | Principal valid, grant absent. Distinct from E3 (licensing) and E2 (provider-side) | **No** |
| **`TENANT_BOUNDARY_VIOLATION`** | G2 | Tenancy unresolvable/ambiguous/crossed. P02 has no tenant concept | **No** |
| **`CONFIGURATION_FAILURE`** | G6 | Our own secret/config could not be resolved — before any provider contact. Distinct from E2, which is the **provider rejecting** a resolved credential | **No** |

| # | Rule |
|---|---|
| NC-1 | These four are **recorded and justified**, per the requirement not to invent P02 classes without explicit justification |
| NC-2 | They are **pre-provider**: all occur before any provider call, at gates outside P02's scope |
| NC-3 | **No E-class is added, removed, renamed or reclassified** |
| NC-4 | Provider-side conditions continue to use E1–E8 exactly as P02 defines them |

### 1.1 The distinctions that must not collapse

| Pair | Difference | Why it matters |
|---|---|---|
| `UNAUTHENTICATED` vs `UNAUTHORIZED` | *We don't know you* vs *we know you and you may not* | Different remedies; different audit meaning |
| `UNAUTHORIZED` vs **E3** `ENTITLEMENT_FAILURE` | *Our* permission model vs the *provider's* licence | Different owners (P03 vs P02/P16) |
| `CONFIGURATION_FAILURE` vs **E2** `AUTHENTICATION_FAILURE` | *We couldn't get a credential* vs *the provider refused ours* | One is our defect, one is a relationship problem |
| `TENANT_BOUNDARY_VIOLATION` vs `UNAUTHORIZED` | Boundary integrity vs grant absence | A boundary violation warrants investigation, not a grant change |
| Any of these vs **E1** `PROVIDER_UNAVAILABLE` | Security/contract vs genuine data unavailability | Only E1 is quality-bearing |

## 2. Complete disposition table

| Condition | Class | Gate | Snapshot? | Quality | Retry | Audit |
|---|---|---|---|---|---|---|
| No principal presented | `UNAUTHENTICATED` | G1 | **No** | — | **No** | Required |
| Principal expired | `UNAUTHENTICATED` (distinguishable) | G1 | **No** | — | No | Required |
| Tenant unresolvable / ambiguous / crossed | `TENANT_BOUNDARY_VIOLATION` | G2 | **No** | — | **No** | Required + investigate |
| Grant absent | `UNAUTHORIZED` | G3 | **No** | — | No | Required |
| Request outside declared capability | **E6** | G4 | **No** | — | No | Required |
| Not licensed — whole request | **E3** | G5 | **No** | — | No | Required |
| Not licensed — some fields | **E3 partial** | G5 | **Yes** | `partial` | No | Required |
| Secret reference unresolvable / store down | `CONFIGURATION_FAILURE` | G6 | **No** | — | **No** | Required |
| Secret expired or revoked | `CONFIGURATION_FAILURE` (distinguishable) | G6 | **No** | — | No | Required |
| Provider rejected our credential | **E2** | G7 | **No** | — | **No** | Required |
| Provider unreachable | **E1** | G7 | **Yes**, empty `fields` | **`unavailable`** | Per P02 | Required |
| Timeout / transient | **E4** | G7 | No | — | Per P02 policy | Required |
| Malformed response | **E5** | G7 | No | — | No | Required |
| Rate limited | **E7** | G7 | No | — | Per P02 policy | Required |
| Mapping failure | **E8** | G7 | No | — | No | Required |
| Invalid request (structurally malformed) | Rejected at the boundary | pre-G1 | **No** | — | No | Required |

**E1 remains the only quality-bearing condition in the entire chain.**

## 3. Fail-closed rules

| # | Rule |
|---|---|
| FC-1 | **Every gate fails closed.** Absent, expired, ambiguous, unevaluable or erroring ⇒ **deny** |
| FC-2 | A denial yields **no data, no partial data, no cached substitute, no stale fallback, no degraded approximation** |
| FC-3 | **No gate may be skipped** because a downstream gate would also have denied, or because an earlier request succeeded |
| FC-4 | A security-infrastructure outage (secret store, authorization service) **denies**. It does **not** open the gate, and it is **not** `quality: 'unavailable'` |
| FC-5 | **There is no emergency bypass, break-glass data path, or "degraded security mode" that serves data** |
| FC-6 | Retry is prohibited for all deterministic security failures — `UNAUTHENTICATED`, `UNAUTHORIZED`, `TENANT_BOUNDARY_VIOLATION`, `CONFIGURATION_FAILURE`, E2, E3, E5, E6, E8 |
| FC-7 | The **earliest** denying gate is the one recorded (P02 CL-7 extended across G1–G7) |

## 4. What "degraded mode" may and may not mean

| Permitted degradation | Prohibited as "degradation" |
|---|---|
| `quality: 'unavailable'` when a provider genuinely cannot serve (E1) | Serving data when authentication cannot be established |
| `quality: 'partial'` + `WITHHELD` for unentitled fields | Serving unentitled data because a check failed |
| `quality: 'stale'` when data is older than baseline | Ignoring tenancy because resolution failed |
| Honest surfacing of any of the above | Using a cached credential past revocation |
| | Using another tenant's data or credential as a substitute |
| | Downgrading a security denial to a quality value |
| | Continuing with a warning |

| # | Rule |
|---|---|
| DM-1 | **Security has no degraded mode.** It is established or it is not |
| DM-2 | Degradation is a property of **data**, never of the **security decision** |
| DM-3 | ⚠ With **M-5 OPEN**, the fail-closed outcome — denial — is the **correct** behaviour. A system that serves production market data without authentication is exhibiting a defect, not resilience |

## 5. Caller-visible behaviour

| # | Rule |
|---|---|
| CV-1 | The caller receives an **honest denial class**, never internal reason detail |
| CV-2 | Errors must not disclose: principal existence, which grant is missing, tenant names, credential state, provider identity, or the authentication mechanism |
| CV-3 | A denial is **never** presented as an empty successful result |
| CV-4 | A denial is never presented as a data-quality problem — that would misattribute the cause to the provider |
| CV-5 | Full detail lives in the **internal audit record**, not in the caller response |

## 6. Boundary conditions

| # | Rule |
|---|---|
| BC-1 | Failures **must not** produce partial or fabricated snapshots |
| BC-2 | A failure **must not** mutate any existing snapshot — snapshots are immutable |
| BC-3 | A failure **must not** alter `snapshotId`, lineage or any P01/P02 version axis |
| BC-4 | A failure **must not** consume or advance a `dataVersion` |
| BC-5 | Failures are **counted and reportable**; a silently discarded failure is itself a contract violation |
