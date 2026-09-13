# P03 — WORK-PACKAGE ACCEPTANCE CRITERIA

**Objective criteria against which the P03 gate may later be assessed.**
**This document does not accept P03.** Gate rule: *"Explicit gate acceptance; no automatic
promotion."*

---

## A. Architecture and boundary correctness

| # | Criterion |
|---|---|
| A-1 | P03's owned scope and its explicit non-scope are both stated |
| A-2 | Relationships to P01, P02, P04 and existing-IIPS are each stated |
| A-3 | The **superseded** D4/D5/D7 "P03 BLOCKED — AUTHORITY" state is reconciled against D8, not mechanically carried forward |
| A-4 | The enforcement point is server-side, single-path, before the adapter |
| A-5 | No second ingress or bypass path is introduced (AD-2; **G2 retired**) |
| A-6 | P03 does **not** claim product-wide security identity authority |

## B. Security / authentication separation

| # | Criterion |
|---|---|
| B-1 | Authentication, authorization, entitlement, tenancy, credentials, provider access and data identity are defined as **seven distinct concerns** |
| B-2 | Caller authentication (AP-1) and service-to-provider authentication (AP-2) are separated, with no credential crossing between them |
| B-3 | `UNAUTHENTICATED` and `UNAUTHORIZED` are distinct and never collapsed |
| B-4 | Authorization is never inferred from a successful provider response |
| B-5 | Security principal identity is never merged with data identity (AD-1) |
| B-6 | The gate chain G1–G7 is ordered, all-must-pass, and evaluated before acquisition |

## C. Tenant isolation

| # | Criterion |
|---|---|
| C-1 | All four guarantees are specified: no cross-tenant credentials, data, lineage contamination or entitlement sharing |
| C-2 | Tenant context is server-derived, single, explicit and immutable per request |
| C-3 | The **identity-vs-isolation** interaction is addressed: `snapshotId` is tenant-independent, so isolation is enforced at access, never by fragmenting identity |
| C-4 | Tenant scoping is required on **every** data endpoint |
| C-5 | AD-11 `canAccess()` is reused, not rebuilt |
| C-6 | Entitlements do not transfer, inherit or cascade between tenants |

## D. Secret handling

| # | Criterion |
|---|---|
| D-1 | Prohibitions cover code, tests, fixtures, logs, errors, audit, payloads, DTOs, UI and version control |
| D-2 | Full lifecycle specified: issue, store, resolve, use, rotate, expire, revoke, destroy |
| D-3 | Rotation and revocation are possible without code change or redeployment |
| D-4 | Configuration and secrets are separate stores; configuration carries references only |
| D-5 | Environments are fully separated; production secrets never exist elsewhere |
| D-6 | **No secret may ever enter an immutable snapshot** — with the reason stated (unrevocability) |
| D-7 | No vendor or product is selected without authoritative evidence |
| D-8 | The package itself contains **no secret** — verified by scan |

## E. Provider integration boundary

| # | Criterion |
|---|---|
| E-1 | P02's accepted artifacts are consumed and **not modified** |
| E-2 | Adapters make no security decisions and receive an already-authorized, tenant-scoped request |
| E-3 | Credentials reach the adapter by scoped reference, resolved at call time, never persisted |
| E-4 | Provider-native detail remains contained; security detail never enters the canonical payload |
| E-5 | Capability and entitlement remain independent gates |
| E-6 | No provider is named, selected, contacted or configured |

## F. Auditability

| # | Criterion |
|---|---|
| F-1 | Both allows and denials are recorded |
| F-2 | Required content is specified for authentication, tenancy, authorization, entitlement, credential resolution, provider access, rejection, and credential/config change |
| F-3 | Every record carries tenant context |
| F-4 | P02 redaction rules are inherited and extended, never relaxed |
| F-5 | Caller-visible errors disclose no principal existence, grant composition, tenant name or credential state |
| F-6 | Audit records are internal artifacts, never product DTOs |
| F-7 | Thresholds and alerting are left to P07/P17 |

## G. Failure behaviour

| # | Criterion |
|---|---|
| G-1 | Every listed failure condition has an explicit class, gate, snapshot disposition, quality impact, retry rule and audit obligation |
| G-2 | **Only E1 `PROVIDER_UNAVAILABLE` is quality-bearing** across the whole chain |
| G-3 | No security failure is expressible as a quality value |
| G-4 | Every gate fails closed; no bypass, break-glass data path or degraded security mode exists |
| G-5 | Deterministic security failures are never retried |
| G-6 | Any new class beyond P02's E1–E8 is **explicitly justified and recorded** — four pre-provider classes, each shown not to overlap an E-class |
| G-7 | No E-class is added, removed, renamed or reclassified |

## H. Lineage implications

| # | Criterion |
|---|---|
| H-1 | `data-${provider}-${dataVersion}-${asOf}` is unchanged, and no security element enters it |
| H-2 | It remains distinct from engine `SNAP_*` |
| H-3 | **No new version axis** is introduced; none of the six is altered |
| H-4 | A credential, authorization-policy or tenant-configuration change changes no axis and no identity |
| H-5 | ADR-02 `contributingData` is unchanged; replay identity is unaffected by principal, tenant or environment |
| H-6 | Replay is explicitly **not** an access-control mechanism |
| H-7 | Lineage and audit are separate records with separate lifetimes |
| H-8 | `tenantId` in lineage is confined to the existing AD-11 governance case |

## I. M-5 limitation handling

| # | Criterion |
|---|---|
| I-1 | M-5 is stated as **OPEN**, owned by **existing-IIPS** |
| I-2 | P03 **does not repair** M-5 and does not alter existing-IIPS authentication |
| I-3 | **No requirement is written as though the existing substrate works** |
| I-4 | Requirements with DIRECT M-5 exposure are identified as specifiable but not satisfiable |
| I-5 | AP-2 is shown to be separable from M-5 |
| I-6 | **C12 is stated as remaining BLOCKED**; the specification does not claim to unblock it |
| I-7 | Fail-closed denial is stated as the **correct** behaviour while M-5 is open |

## J. No P04 scope leakage

| # | Criterion |
|---|---|
| J-1 | The canonical security master is not designed, specified or implemented |
| J-2 | **OI-08 and OI-09 are untouched** and attributed to P04 |
| J-3 | No canonical identity resolution, aliasing or approximation occurs |
| J-4 | `identityMappingVersion` remains a P04 product, passed through |
| J-5 | AD-1 is preserved; the certified `companyId` CSIP join key is untouched |
| J-6 | No identity-mapping methodology is changed |

## K. No methodology or certification change

| # | Criterion |
|---|---|
| K-1 | No engine, scoring, calibration or taxonomy change |
| K-2 | No new engine metric key; methodology authority remains Ramki/Sai |
| K-3 | No existing-IIPS source, test or certification artifact modified |
| K-4 | E2E-030 **NOT REVOKED, NOT RENEWED**; M-1 remains `OPEN_REVALIDATION_REQUIRED` |
| K-5 | **No certification granted** — `NONE_GRANTED` |
| K-6 | **No production activation** — `NOT_AUTHORIZED` |
| K-7 | No new data domain beyond D01–D10 |

## L. Authority and open-item integrity

| # | Criterion |
|---|---|
| L-1 | **No person is assigned or inferred to A1** |
| L-2 | A1 clearance is not treated as an A1 content decision |
| L-3 | Every decision the package cannot make is recorded as an **open decision**, not resolved by inference |
| L-4 | OI-10 untouched; no namespace token invented |
| L-5 | AD-17 untouched and unresolved |
| L-6 | No downstream dependency absorbed into P03 scope |
| L-7 | **UNKNOWN is recorded rather than guessed** |

## M. Package integrity

| # | Criterion |
|---|---|
| PK-1 | All artifacts present, internally consistent, and cross-referenced correctly |
| PK-2 | Traceability to D4/D5/D7/D8/P00/P01/P02 with pinned commits per `P00_EVIDENCE_CONVENTIONS.md` |
| PK-3 | Protected artifacts unchanged — D4–D8, P00, P01, P02, tracker, SPEC |
| PK-4 | No file outside `docs/p03/` created or modified |
| PK-5 | No executable source produced |
| PK-6 | Checksums recorded and verifiable |
