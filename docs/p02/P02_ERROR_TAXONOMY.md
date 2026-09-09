# P02 — PROVIDER ERROR AND FAILURE TAXONOMY

**SPECIFICATION ONLY.**

> **Governing distinction, inherited from P01:**
> a **contract violation** is a **rejection**; a **data condition** is a **quality state**.
> **A contract violation must never be laundered into partial quality.**

---

## 1. The taxonomy

Eight mandatory classes. Every provider-side or adapter-side failure maps to exactly one.

| # | Class | Meaning | Disposition |
|---|---|---|---|
| **E1** | `PROVIDER_UNAVAILABLE` | Source unreachable, down, or refusing service | **Data condition** → `quality: 'unavailable'` |
| **E2** | `AUTHENTICATION_FAILURE` | Identity not established / rejected by the provider | **Rejection** |
| **E3** | `ENTITLEMENT_FAILURE` | Identity valid, but not licensed for this data/mode/environment | **Rejection** |
| **E4** | `TRANSIENT_FAILURE` | Timeout, connection reset, retryable server error | **Rejection after retry policy is exhausted**; may degrade to E1 |
| **E5** | `MALFORMED_RESPONSE` | Response violates the declared provider schema | **Rejection** |
| **E6** | `UNSUPPORTED_CAPABILITY` | Request outside the declared capability | **Rejection** (pre-flight, before any provider call) |
| **E7** | `RATE_LIMIT_FAILURE` | Provider quota/throttle exceeded | **Rejection**; may degrade to E1 under policy |
| **E8** | `CONTRACT_MAPPING_FAILURE` | Response is well-formed but cannot be mapped to the canonical contract deterministically and completely | **Rejection** |

### 1.1 Why E2 and E3 are separate

`AUTHENTICATION_FAILURE` is *"we do not know who you are"*; `ENTITLEMENT_FAILURE` is *"we know
who you are and you may not have this"*. They have different owners (P03 vs P02), different
remedies, and different audit meanings. **Collapsing them destroys the diagnosis.**

### 1.2 Why E1 is the only quality-bearing class

E1 describes **the data**: the source genuinely has nothing to give right now, and the existing
`quality: 'unavailable'` enum value exists precisely for this. E2–E8 describe **us, the
request, or the contract** — none is a statement about market data, so none may be expressed as
a quality value.

---

## 2. Mapping into the P01 contract

| Class | Snapshot produced? | `quality` | `availability` effect | Evidence event |
|---|---|---|---|---|
| E1 `PROVIDER_UNAVAILABLE` | **Yes** — with empty `fields` | `unavailable` | n/a (empty field set is permitted **only** here) | Required |
| E2 `AUTHENTICATION_FAILURE` | **No** | — | — | Required |
| E3 `ENTITLEMENT_FAILURE` (whole request) | **No** | — | — | Required |
| E3 `ENTITLEMENT_FAILURE` (partial fields) | **Yes** | `partial` | affected fields `WITHHELD` + `entitlementRef` | Required |
| E4 `TRANSIENT_FAILURE` | **No** (may become E1 under policy) | — | — | Required |
| E5 `MALFORMED_RESPONSE` | **No** | — | — | Required |
| E6 `UNSUPPORTED_CAPABILITY` | **No** | — | — | Required |
| E7 `RATE_LIMIT_FAILURE` | **No** (may become E1 under policy) | — | — | Required |
| E8 `CONTRACT_MAPPING_FAILURE` | **No** | — | — | Required |

### 2.1 Partial and stale outcomes — **not** errors

| Outcome | Class | Representation |
|---|---|---|
| Provider returned a structurally valid subset | *Not an error* | `quality: 'partial'` + accurate `completenessPct`; missing fields `NOT_PROVIDED` |
| Provider returned data older than the session/freshness baseline | *Not an error* | `quality: 'stale'` (thresholds are **P07**) |
| Provider explicitly asserts no value exists | *Not an error* | `availability: NULL_ASSERTED` |
| Complete, fresh, valid | *Not an error* | `quality: 'good'` |

---

## 3. Classification rules

| # | Rule |
|---|---|
| CL-1 | Every failure is classified into **exactly one** class. `UNKNOWN` classification is itself a failure of the adapter contract |
| CL-2 | Classification is **explicit and typed** — never a bare exception, string or provider-native code |
| CL-3 | **No provider-native error code, message or enum crosses the boundary.** Native detail may be recorded in the audit record; the *class* is the contract |
| CL-4 | E6 is evaluated **pre-flight**, before any provider call |
| CL-5 | E3 is evaluated **pre-flight**, before any provider call |
| CL-6 | E8 is evaluated **after** response validation — a mapping failure is distinct from a malformed response |
| CL-7 | A failure that could plausibly be two classes is classified by the **earliest gate that would deny it** (E6 before E3 before E2 before E1) |

### 3.1 E4 / E7 escalation policy

| # | Rule |
|---|---|
| ES-1 | Retry policy is **declared**, bounded and deterministic in its terminal outcome |
| ES-2 | Retries are **never** silent: attempt count is recorded in the audit record |
| ES-3 | On exhaustion, E4/E7 may be **policy-mapped to E1** (`quality: 'unavailable'`) — this mapping must be **explicit and recorded**, never implicit |
| ES-4 | Retry must not be applied to E2, E3, E5, E6 or E8 — retrying a deterministic failure is prohibited |
| ES-5 | **Retry orchestration is implemented in P05**, not here |

---

## 4. Absolute prohibitions

| # | Prohibited without exception |
|---|---|
| PR-1 | Presenting any failed or degraded acquisition as `quality: 'good'` |
| PR-2 | Expressing E2–E8 as `quality: 'partial'`, `'stale'` or `'unavailable'` (except the explicit, recorded E4/E7 → E1 escalation) |
| PR-3 | Returning an empty success in place of a failure |
| PR-4 | Substituting a default, zero, empty string, prior value or cached value |
| PR-5 | Silently narrowing the request to what happened to succeed |
| PR-6 | Silently substituting another provider (fallback is an orchestration decision **above** the adapter) |
| PR-7 | Swallowing a failure without an evidence-bearing record |
| PR-8 | Leaking a credential, endpoint, token or account identifier into an error message or log |
| PR-9 | Emitting a partially mapped snapshot after an E8 |

**These restate NFR-04:** *invalid, incomplete, contradictory or unavailable data is classified
and propagated, not silently coerced.*

---

## 5. Required failure-record content

Every classified failure emits an evidence-bearing record (NFR-07) containing:

| # | Element |
|---|---|
| F-1 | Error class (E1–E8) |
| F-2 | Internal `provider` identity |
| F-3 | `adapterId` + `adapterVersion` |
| F-4 | Requested domain, mode, field set, granularity, range |
| F-5 | Identity reference of the request (no provider-native symbol) |
| F-6 | `receivedAt` / attempt timestamps |
| F-7 | Attempt count and terminal disposition (for E4/E7) |
| F-8 | Canonical `schemaVersion` and `namespaceVersion` |
| F-9 | `entitlementRef` (E3) — the requirement, **never** the credential |
| F-10 | For E5/E8: the offending canonical field slot(s) and the rule violated — **not** the provider payload verbatim |
| F-11 | Whether any snapshot was produced |

| # | Rule |
|---|---|
| FR-1 | Failure records are **counted and reportable**. A silently discarded failure is itself a contract violation |
| FR-2 | Failure records **must not** contain secrets, credentials, endpoints or unredacted provider payloads |
| FR-3 | **Operational alerting, dashboards and incident handling are P17** — not implemented here |

---

## 6. Interaction with the P01 validation stages

| P01 stage | Relationship |
|---|---|
| S1 structural | An adapter emitting a structurally invalid snapshot is an **E8**, caught before emission |
| S2 namespace partition | C1–C6 fail-closed; a violation is a rejection, never a quality state. ⚠ Mechanical checking blocked on **OI-10** |
| S3 semantic | Missing currency/unit/precision on mapping ⇒ **E8** |
| S4 referential | Missing lineage/identity/mapping version ⇒ **E8** |
| S5 quality | Only here do `good`/`stale`/`partial`/`unavailable` arise |
