# P02 — ENTITLEMENT AND LICENSING MODEL

**SPECIFICATION ONLY.** Satisfies tracker `P02-02` (*"Entitlement model / Entitlement matrix"*,
dependency `P00-04, P02-01`, classification **Governance**).

> **P02 defines the entitlement *boundary and representation*.
> P03 owns credentials, secrets, service identity and tenant enforcement.
> No credential, secret, key, token, endpoint or account appears anywhere in this program.**

---

## 1. Separation of concerns

| Concern | Owner | P02 position |
|---|---|---|
| **Is this data licensed for this use?** | **P02** — entitlement model | **Defined here** |
| Which credential proves it, and where is it stored? | **P03** | **Not defined here** |
| Tenant/role enforcement mechanics | **P03** | Requirements stated only |
| Governance classification of licensed content | AD-11 (existing `DataGovernanceRuntime`) | **Reused, not rebuilt** |
| Commercial licence negotiation and activation | **P16** | Out of scope |

| # | Rule |
|---|---|
| SC-1 | An entitlement **decision** is in scope; the **credential** proving it is not |
| SC-2 | P02 must **not** implement the production secrets/security system |
| SC-3 | **No real secret may be committed** — to source, fixtures, documents, logs or evidence records |
| SC-4 | ⚠ **M-5** (existing-IIPS authentication/session not wired) is **recorded, not repaired**. Entitlement design must not presume a working auth substrate |

---

## 2. The entitlement dimensions

An entitlement decision is evaluated over **all** of these; any one may deny.

| # | Dimension | Content |
|---|---|---|
| EN-1 | **Dataset / domain** | Which of D01–D10, and which dataset within it |
| EN-2 | **Field scope** | Some licences entitle a subset of fields |
| EN-3 | **Mode** | LIVE may be entitled where PIT/historical is not, and vice versa |
| EN-4 | **Granularity** | Intraday vs end-of-day are commonly separately licensed |
| EN-5 | **History depth** | Bounded historical entitlement |
| EN-6 | **Redistribution / display** | Internal analytics vs display to end users vs redistribution |
| EN-7 | **Derived-works rights** | Whether derived values may be produced, stored or shown |
| EN-8 | **Environment eligibility** | Development / test / certification / production are **separately** entitled |
| EN-9 | **Tenant scope** | Which tenants may access — enforcement is **P03** |
| EN-10 | **Region** | Jurisdictional restriction |
| EN-11 | **Retention** | Permitted retention period |
| EN-12 | **Validity window** | Entitlements are effective-dated and expire |

### 2.1 Environment eligibility (tracker: *"environment eligibility"*)

| # | Rule |
|---|---|
| EE-1 | An entitlement valid in one environment grants **nothing** in another |
| EE-2 | A production entitlement is **never** assumed from a development entitlement |
| EE-3 | The **absence** of a production entitlement is the normal state — production activation is `NOT_AUTHORIZED` and is **P16** |
| EE-4 | Certification environments require their own explicit entitlement (**P15**) |

---

## 3. Evaluation rules — fail closed

| # | Rule |
|---|---|
| EV-1 | Entitlement is evaluated **before acquisition**, never after |
| EV-2 | Entitlement and capability are **independent gates**. Both must pass. Capability is not permission |
| EV-3 | **Default deny.** An entitlement that is absent, expired, `UNKNOWN` or unevaluable **denies** |
| EV-4 | **Fail-closed:** a denial yields no data, no partial data, no cached substitute, no degraded approximation |
| EV-5 | A denial is an **explicit classified state** — never an empty success, never a zero, never an absent field with no marker |
| EV-6 | A denial is **evidence-bearing and auditable** (NFR-07) |
| EV-7 | Entitlement state is **never inferred from a successful provider response**. A provider erroneously serving unentitled data does not create entitlement |
| EV-8 | Partial entitlement over a requested field set yields the entitled fields **plus explicit `WITHHELD` markers** — it is **not** a silent narrowing (contrast with unsupported capability, which fails the whole request) |

### 3.1 Representation of a denial in the P01 contract

| Situation | Representation |
|---|---|
| Whole request unentitled | `ENTITLEMENT_FAILURE` — **rejection**, no snapshot produced |
| Some fields unentitled | Snapshot produced; each unentitled field `availability = WITHHELD` with an `entitlementRef`; `completenessPct` reduced accordingly |
| Entitlement unevaluable | **Deny** — treated as whole-request `ENTITLEMENT_FAILURE`. Never optimistic |
| Entitlement expired | Deny, distinguishable from never-entitled in the audit record |

| # | Rule |
|---|---|
| RD-1 | `WITHHELD` is **never** conflated with `NOT_PROVIDED`. Suppression and silence are different facts |
| RD-2 | Every `WITHHELD` field carries an `entitlementRef` in lineage (P01 NL-5) |
| RD-3 | An `ENTITLEMENT_FAILURE` rejection is **not** `quality: 'unavailable'` — it is a contract condition, not a data condition |

---

## 4. Governance interaction (AD-11)

| # | Rule |
|---|---|
| GV-1 | Licence-restricted content (**D06** news, **D09** alternative data) additionally requires classification via the existing `DataGovernanceRuntime.classify()` — **REUSED, not rebuilt** |
| GV-2 | The classification (`public` / `internal` / `confidential` / `restricted`), `region` and `tenantId` are recorded in the snapshot lineage |
| GV-3 | Classification is **not** entitlement; both apply independently |
| GV-4 | ⚠ **M-6:** `isWithinRetention()` is a stub — **retention is NOT enforced** by existing-IIPS. Recording `retentionDays` is **not** an enforcement claim. **Not repaired here** |
| GV-5 | An entitlement whose only control is retention is therefore **not enforceable today**; this must be recorded as a limitation wherever relied upon (DEP-P02-03) |
| GV-6 | ⚠ **OI-05** (alternative-data applicability criteria) remains **OPEN** — D09 entitlement cannot be finalized (DEP-P02-02) |

---

## 5. The entitlement matrix (tracker deliverable `P02-02`)

The **structure** is defined; **no populated matrix exists**, because no provider or dataset has
been selected and no commercial licence exists.

| Column | Content |
|---|---|
| Entitlement ID | Governed internal identifier |
| Provider identity | Internal `provider` token |
| Dataset / domain | D01–D10 + dataset |
| Field scope | Canonical field slots, or ALL |
| Modes | LIVE / SNAPSHOT / PIT subset |
| Granularity scope | Permitted intervals |
| History scope | Permitted depth |
| Redistribution / display / derived rights | Explicit, per EN-6 / EN-7 |
| Environments | Explicit list; production listed only when actually granted |
| Tenants / region | Scope (enforcement P03) |
| Retention | Permitted period + ⚠ M-6 non-enforcement note |
| Validity | `validFrom` / `validTo` |
| Evidence reference | The governing authority record |

| # | Rule |
|---|---|
| EM-1 | A row exists **only** where an actual entitlement has been granted and evidenced |
| EM-2 | **No row may be invented, assumed or pre-populated.** The matrix is **empty at P02** and that is the correct state |
| EM-3 | Populating it requires provider selection (**no authority recorded** — DEP-P02-07) and licensing (**P16**) |
| EM-4 | An empty matrix means **nothing is entitled**, which is consistent with `NOT_AUTHORIZED` production activation |

---

## 6. Secrets prohibition — absolute

| # | Prohibition |
|---|---|
| SP-1 | No credential, API key, token, password, certificate or private key in any artifact |
| SP-2 | No provider endpoint, hostname, account ID or tenant secret |
| SP-3 | No secret in fixtures, test data, examples or documentation |
| SP-4 | No secret in logs, error messages, evidence records or observability output |
| SP-5 | Entitlement records reference a **credential *requirement***, never a credential |
| SP-6 | Verified at completion: `P02_EVIDENCE.md` §5 records the scan result |
