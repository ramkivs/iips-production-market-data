# P03 — SECRET AND CONFIGURATION REQUIREMENTS

**SPECIFICATION ONLY.** Satisfies tracker `P03-01` (*"Secrets design"* — *"Secure provider
credentials and prohibit secrets in code/tests/logs"*).

> **No secret, credential, key, token, endpoint, account or vendor product name appears in this
> package. No secret-management product is selected** — no authoritative evidence requires one
> (`P03_SCOPE_AND_BOUNDARY.md` AC-4).

---

## 1. Absolute prohibitions

| # | Prohibited |
|---|---|
| SP-1 | Secrets in source code |
| SP-2 | Secrets in tests, fixtures, sample data or documentation |
| SP-3 | Secrets in logs, error messages, stack traces or diagnostics |
| SP-4 | Secrets in observability, audit or evidence records |
| SP-5 | Secrets in **canonical market-data payloads**, `fields`, lineage or provenance |
| SP-6 | Secrets in DTOs, API responses, UI or client bundles (NFR-05) |
| SP-7 | Secrets in version control — **in any form, at any time, including history** |
| SP-8 | Secrets in container images, build artifacts or CI configuration committed here |
| SP-9 | Provider endpoints, hostnames, account identifiers or subscription IDs treated as non-sensitive |
| SP-10 | A secret persisted to disk by an adapter |

**These prohibitions are absolute and have no exception clause.**

## 2. Secret lifecycle

| Stage | Requirement |
|---|---|
| **Issue** | A secret is issued for **one** provider relationship, **one** environment, and where applicable **one** tenant boundary. Scope is recorded at issue |
| **Store** | Held in a dedicated secret boundary, **outside** application configuration and **outside** this repository. Encrypted at rest and in transit |
| **Resolve** | Resolved **at call time**, by scoped reference, by an authorized service principal. Never compiled in, never cached to disk |
| **Use** | Held in memory for the **minimum necessary duration**; used only for AP-2 provider authentication |
| **Rotate** | Rotatable **without code change and without downtime**; overlapping validity is supported so rotation is not an outage |
| **Expire** | Expiry is enforced, not advisory. An expired secret fails closed |
| **Revoke** | Revocable **immediately and unilaterally**; revocation takes effect without redeployment |
| **Destroy** | Removed from all stores on retirement; the **reference** may persist in audit, the **value** never does |

| # | Rule |
|---|---|
| SL-1 | Every stage is **auditable by reference** — who issued, rotated, revoked, when — **never by value** |
| SL-2 | Rotation and revocation are **operational capabilities required by design**, not later additions |
| SL-3 | A secret that cannot be rotated or revoked is **non-conforming** |
| SL-4 | Rotation **must not** alter `provider` identity, `snapshotId`, lineage or any P01/P02 version axis — a credential change is **not** a data or adapter change |
| SL-5 | Rotation frequency and expiry values are an **open decision** (`P03_OPEN_ITEMS.md` OD-3) |

## 3. Configuration separation

| # | Requirement |
|---|---|
| CF-1 | **Configuration and secrets are separate concerns with separate stores.** A secret is never "just another config value" |
| CF-2 | Configuration is **declarative, versioned and reviewable**; secrets are **referenced**, never inlined |
| CF-3 | A configuration artifact contains **secret references only** — an identifier resolvable by an authorized principal |
| CF-4 | A reference must not itself be sensitive, and must not encode a credential |
| CF-5 | Configuration changes are **audited**, including who changed what and when |
| CF-6 | An unresolvable reference is `CONFIGURATION_FAILURE` — **fail closed**, never a silent skip or default |
| CF-7 | Adapter capability declarations (P02) are **configuration**, never secret-bearing |

## 4. Environment separation

| # | Requirement |
|---|---|
| EV-1 | Development, test, certification and production are **fully separated** secret and configuration domains |
| EV-2 | A secret valid in one environment is **invalid and unresolvable** in another |
| EV-3 | **Production secrets are never present** in development, test or certification environments — not copied, not mirrored, not "temporarily" |
| EV-4 | Environment is **explicit** in every resolution; there is no implicit or inherited default |
| EV-5 | This mirrors P02's entitlement rule **EE-1/EE-2**: an entitlement in one environment grants nothing in another |
| EV-6 | ⚠ **No production credential exists or may be created** — production activation is `NOT_AUTHORIZED` and provider onboarding is **P16** |
| EV-7 | Certification environments require their own separately issued secrets (**P15**) |

## 5. Non-persistence in market data — critical

| # | Rule |
|---|---|
| NP-1 | **No credential, token, account, endpoint or secret reference may appear in a `DataSnapshot`, its `fields`, or its lineage block** |
| NP-2 | P01 lineage records `sourceRef`, `adapterId`, `adapterVersion`, `transformationChainRef` — **all non-secret program-internal identifiers** |
| NP-3 | `entitlementRef` references an **entitlement requirement record**, never a credential (P02 SP-5) |
| NP-4 | Because snapshots are **immutable and long-lived**, a secret written into one is **effectively unrevocable** — this is the reason NP-1 is absolute |
| NP-5 | Redaction after the fact is **not** a control. The value must never be written |

## 6. Access to secrets

| # | Requirement |
|---|---|
| AS-1 | Only an authorized **service principal** may resolve a secret. Human access to production secret values is **exceptional, audited and justified** |
| AS-2 | **Least privilege**: a principal resolves only the secrets its function requires |
| AS-3 | Every resolution attempt — success and failure — is **audited by reference** |
| AS-4 | A tenant may **never** cause resolution of another tenant's credential (IS-1) |
| AS-5 | Resolution requires the caller's own authentication ⇒ ⚠ **M-5 exposure** on the human path; the service path is separable |

## 7. Failure and revocation behaviour

| Condition | Class | Behaviour |
|---|---|---|
| Secret reference unresolvable | `CONFIGURATION_FAILURE` | **Fail closed.** No provider call |
| Secret store unreachable | `CONFIGURATION_FAILURE` | **Fail closed.** Not degraded to `quality: 'unavailable'` |
| Secret expired | `CONFIGURATION_FAILURE`, distinguishable from absent | Fail closed |
| Secret revoked | `CONFIGURATION_FAILURE`, distinguishable from expired | Fail closed, **immediately** |
| Provider rejects a resolved secret | **E2** `AUTHENTICATION_FAILURE` | Fail closed, **no retry** |
| Rotation in progress, both valid | — | Succeeds; no data or identity impact (SL-4) |

| # | Rule |
|---|---|
| FR-1 | **No stale-credential fallback.** A revoked or expired secret is never used because "it worked last time" |
| FR-2 | **No cached-data substitute** on a credential failure |
| FR-3 | A credential failure is **never** presented as a data condition |
| FR-4 | Revocation must not require redeployment |
| FR-5 | Failure records name the **reference and the class**, never the value |

## 8. Verification obligation

| # | Requirement |
|---|---|
| VO-1 | A secret-scanning control over source, configuration, fixtures and documentation is a **required** part of P03 implementation evidence |
| VO-2 | Tracker `P03-01` acceptance is *"Secrets flow passes security checks"* — an **implementation-time** obligation, deferred (`P03_EVIDENCE.md` §3) |
| VO-3 | This specification package has itself been scanned; the result is recorded in `P03_EVIDENCE.md` §5 |
