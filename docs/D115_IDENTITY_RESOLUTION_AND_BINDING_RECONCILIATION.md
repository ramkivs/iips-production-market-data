# D115 — IDENTITY RESOLUTION AND BINDING RECONCILIATION

**Assessment type:** Read-only qualification/evidence assessment  
**Assessment date:** 2026-09-22 (UTC)  
**Repository baseline inspected:** `da4305149bd5495789f893f530edb2526d08bb5b`  
**Branch:** `arena/01a0c86d-iips-production-market-data`  
**Decision:** **D115 IDENTITY RESOLUTION = BLOCKED**

> This record is an evidence assessment and a durability record. It is not an identity binding,
> a D115 qualification, a production authorization, a credential record, a Keycloak provisioning
> act, or a change to an accepted product gate.

---

## 1. Executive finding

The repository contains useful **contracts and fail-closed mechanisms**, but it does not contain
sufficient authoritative evidence to establish the D115 identity tuple:

```text
Existing-IIPS organizational principal
  → D115 governance authority
  → runtime identity custodian
  → HDFC Life / D115 companyId
  → explicit environment
  → qualified OIDC/Keycloak binding
  → authorized Company/Security binding
```

The repository does **not** identify an HDFC Life/D115 principal, does **not** identify a
D115-scoped governance authority or runtime custodian, does **not** contain an HDFC Life/D115
`companyId`, and does **not** contain a D115-specific Stage 3 identity artifact. Generic test
identities, generic `tenant-A`/`tenant-B` values, local Keycloak defaults, synthetic sector
`companyId` values, code authorship, and existing phase acceptors are not valid substitutes.

The current evidence supports only these bounded conclusions:

1. Identity/security, authorization, tenant, entitlement, provider credential, and data identity
   are separate concerns. (`docs/p03/P03_SECURITY_AUTH_CONTRACT.md:13-30`)
2. An absent, ambiguous, unapproved, or unevaluable identity must deny rather than fall back.
   (`docs/p03/P03_SECURITY_AUTH_CONTRACT.md:34-56`; `docs/d4/D4_05_SECURITY_MASTER_ADAPTER.md:100-117`)
3. The existing `companyId` is a certified CSIP join key and the repository contract requires an
   explicit, versioned, auditable mapping to it. (`docs/d4/D4_05_SECURITY_MASTER_ADAPTER.md:85-117`;
   `docs/p04/P04_IDENTITY_ADAPTER_CONTRACT.md:8-20`)
4. The OIDC/Keycloak implementation seam exists, but live qualification is conditional on an
   externally supplied and reachable environment. (`frontend/server/admin-transport.ts:276-310`;
   `frontend/server/live/live-tenant-engine.test.ts:4-16,72-84`)
5. None of those technical facts establishes the missing D115 organizational or business
   binding.

**No application code was modified by this assessment.** The only post-assessment repository
change is this documentation report.

---

## 2. Evidence handling and labels

This report uses the following strict separation:

| Label | Meaning | Use in this report |
|---|---|---|
| **REPOSITORY** | A statement directly present in tracked repository content at the inspected baseline, with a path and line/section reference | Establishes contracts, boundaries, and what artifacts do or do not exist |
| **EXTERNAL-AUTHORITY** | Evidence that must be supplied by an authorized Existing-IIPS/D115/IdP/operations authority; not present merely because the repository mentions a role | Required to establish the real binding |
| **INFERENCE** | A conclusion about repository structure or consequences, not an identity fact | Never promoted to a binding value |
| **UNRESOLVED** | A required fact for which no authoritative evidence was found | Remains fail-closed |
| **USER-PROVIDED INPUT** | A constraint or blocker stated in the assessment request | Recorded as input, not independently verified repository evidence |

### Assessment method

The read-only inspection included:

- tracked documentation and source references for Existing-IIPS, authority, identity, custodian,
  `companyId`, Company/Security, OIDC, Keycloak, Stage 3, Dhan, and NSE;
- exact D115/HDFC/Dhan searches and filename inventory;
- relevant P03/P04/P05/P06/P11/P12/P13 contracts and evidence artifacts;
- the browser OIDC client, server-side Keycloak adapter/verifier, live qualification test, and
  provisioning harness;
- the existing `companyId`/CSIP and Stage 3 ingress contracts.

The exact semantic token `D115` has no repository artifact at the inspected baseline. One
incidental `D115` substring occurs inside an unrelated MD5 value in
`docs/p03/P03_EVIDENCE.md:148`; that is not a D115 record. There are **zero** HDFC references
and **zero** Dhan references. The repository does contain NSE selection artifacts; those are
addressed explicitly in §9 and are not silently rewritten.

No live Keycloak endpoint, provider endpoint, credential, token, secret, or production system was
contacted.

---

## 3. Current-state identity evidence matrix

| Inspection area | Repository evidence | Evidence class | Current determination | Effect on D115 |
|---|---|---|---|---|
| **A. Existing-IIPS organizational/service principal** | `existing-IIPS` is used as the owner/boundary for the unresolved M-5 authentication issue; the record says it is not repaired by this program. (`docs/p03/P03_OPEN_ITEMS.md:25-33,41-51`) | REPOSITORY | **Organizational label present; authoritative principal identity absent** | **UNRESOLVED**. No principal ID, service-account ID, owner record, or D115 scope can be inferred |
| **B. D115 governance/authority** | A1 clearance is a generic program clearance with `person_named: false`; clearance is expressly not a substantive content decision. (`docs/p00/P00_AUTHORITY_REGISTER.md:37-45`; `docs/p03/P03_OPEN_ITEMS.md:7-23`) | REPOSITORY | **No D115-scoped authority act found** | **UNRESOLVED**. Existing phase acceptors or commit authors cannot be promoted to D115 authority |
| **C. Runtime identity custodian** | `SecuredExecutor` and `TenantDirectory` are technical enforcement interfaces; they map a validated identity to a tenant at runtime. (`frontend/server/secured-executor.ts:16-43`) The service-principal model remains an open decision. (`docs/p03/P03_OPEN_ITEMS.md:20-23`) | REPOSITORY | **Technical seam exists; custodian designation absent** | **UNRESOLVED**. A code component is not an accountable custodian or approval |
| **D. HDFC Life / D115 `companyId`** | No HDFC or D115 business record was found. Generic `companyId` is a string at the CSIP boundary, and existing values are documented as synthetic sector labels, not entity IDs. (`docs/d4/D4_05_SECURITY_MASTER_ADAPTER.md:13-25`) | REPOSITORY | **No authoritative D115 value** | **UNRESOLVED**. `Technology-H1`, `Banking-H1`, fixtures, symbols, issuer names, or guessed strings are prohibited substitutions |
| **E. OIDC / Keycloak configuration and identity contracts** | OIDC client and server verifier contracts exist. Browser defaults are local (`oidcClient.ts:67-90`); live server discovery returns no executor when `KEYCLOAK_URL` is absent (`admin-transport.ts:276-300`). Real verification requires issuer, audience, and JWKS signature validation (`real-oidc-verifier.ts:46-96`). | REPOSITORY | **Implementation seam exists; selected D115 environment and live qualification absent** | **PENDING / ENVIRONMENT-DEPENDENT** |
| **F. Company/Security binding contracts** | P04/AD-1 requires canonical security identity → explicit governed mapping → existing `companyId`; records require target, version, effective dates, source, confidence, approval, and audit references. (`docs/d4/D4_05_SECURITY_MASTER_ADAPTER.md:85-117`) P05 has a fixture-backed, fail-closed `MappingRegister` (`p05/src/identity.js:68-115`). | REPOSITORY | **Contract and generic enforcement partially present; D115 record absent** | **BLOCKED** until the external mapping fact and authority reference are supplied |
| **G. Existing D115 Stage 3 identity artifacts** | No D115-named Stage 3 artifact found. Generic P11 Stage 3 is `DataBoundRequest → DataBoundExecutor` and returns an execution result/provenance; it is not an organizational identity binding. (`p11/src/engineIngressPath.js:184-226`) | REPOSITORY | **Generic Stage 3 exists; D115 identity artifact absent** | **UNRESOLVED**. No D115 principal/custodian/companyId/environment linkage can be claimed |
| **H. Authoritative evidence already present** | The repository provides normative contracts, synthetic fixtures, and historical governance records. It does not provide the required external authority packet for D115/HDFC Life. | REPOSITORY | **Technical evidence exists; authoritative business/operational evidence absent** | Binding cannot be established |
| **I. Does the repository contain enough evidence to establish any part?** | It establishes fail-closed rules, separation of security principal from data identity, and the required mapping-record shape. (`docs/p03/P03_SECURITY_AUTH_CONTRACT.md:23-30`; `p05/src/identity.js:37-57,89-115`) | REPOSITORY + INFERENCE | **Partial technical resolution only** | No tuple value, authorization, or production qualification is established |

### Matrix conclusion

**PARTIALLY RESOLVED at the contract/mechanism level; BLOCKED at the D115 binding level.**
Because the requested return status concerns unblocking the D115 identity path, the assessment
status is **BLOCKED**, not RESOLVED or PARTIALLY RESOLVED.

---

## 4. Principal → authority → custodian → companyId → environment mapping

This is the required mapping. It is intentionally not populated with guessed values.

| Binding component | Value at inspected baseline | Repository basis | Authority evidence required | Status |
|---|---|---|---|---|
| Existing-IIPS organizational principal | **NOT IDENTIFIED** | `existing-IIPS` is an ownership/boundary label only (`docs/p03/P03_OPEN_ITEMS.md:29-33,45-47`) | Authoritative organizational record with stable principal/service identity, role, scope, and effective date | **UNRESOLVED** |
| D115 governance authority | **NOT IDENTIFIED** | Generic A1 is cleared but `person_named: false`; no D115 act (`docs/p00/P00_AUTHORITY_REGISTER.md:37-45`) | Explicit D115 authority act naming the authority, scope, decision/reference ID, and effective date | **UNRESOLVED** |
| Runtime identity custodian | **NOT DESIGNATED** | Technical `TenantDirectory`/`SecuredExecutor` seam is not a designation (`frontend/server/secured-executor.ts:16-43`) | Named accountable team/role and service-principal custodian, with environment and audit responsibilities | **UNRESOLVED** |
| HDFC Life / D115 `companyId` | **UNRESOLVED** | No HDFC/D115 hit; generic values are synthetic sector labels (`docs/d4/D4_05_SECURITY_MASTER_ADAPTER.md:17-25`) | HDFC Life/D115 authoritative company record and exact `companyId` literal, with source and effective date | **UNRESOLVED** |
| Canonical company/security relation | **NOT ESTABLISHED** | P04 requires canonical security/issuer IDs and an explicit mapping record (`docs/d4/D4_05_SECURITY_MASTER_ADAPTER.md:49-66,113-117`) | Approved canonical issuer/security record and relation to the target `companyId`; FIGI evidence where applicable | **UNRESOLVED** |
| Mapping version / approval / audit reference | **NOT ESTABLISHED for D115** | Generic `MappingRegister` requires version and approval; unapproved mappings fail (`p05/src/identity.js:74-85,97-115`) | Mapping version, approval reference, audit reference, effective window, source, method, confidence | **UNRESOLVED** |
| Runtime environment | **NOT IDENTIFIED** | P03 requires fully separated dev/test/certification/production domains and explicit environment (`docs/p03/P03_SECRET_CONFIGURATION_REQUIREMENTS.md:62-72`) | Explicit target environment and deployment/account/tenant boundary; no inherited default | **UNRESOLVED** |
| OIDC issuer / realm / client / JWKS | **NOT QUALIFIED for D115** | Local defaults exist; live discovery is conditional (`frontend/src/core/auth/oidcClient.ts:67-90`; `frontend/server/admin-transport.ts:276-300`) | Sanitized discovery metadata, issuer/audience/client record, JWKS endpoint and live qualification evidence for the selected environment | **UNRESOLVED** |
| Dhan Level-1 route | **Active only as an assessment instruction** | No Dhan reference exists in the repository | Provider/entitlement authority evidence for the Dhan route and selected environment | **EXTERNAL-AUTHORITY / NOT REPOSITORY-QUALIFIED** |
| NSE route | Historical repository artifacts select NSE; this assessment does not use them to override the request | `docs/PHASE_07_O3_ACT_B_SELECTION.md:1-13`; `p07/src/providerReconciliation.js:83-101` | Separate authority reconciliation if the route selection must be made durable in repository governance | **CONFLICTING EVIDENCE — NOT REOPENED** |

**No row above may be completed by inference.** In particular, `iips`, `iips-spa`, local
`localhost` URLs, `tenant-A`, `admin-a`, `analyst-a`, or a synthetic `*-H1` value are development
or contract values, not a D115 mapping.

---

## 5. Exact missing facts/evidence

The following facts are hard prerequisites. The report does not supply any of them.

### 5.1 Principal fact

Required external evidence:

- Existing-IIPS organizational or service-principal legal/name record;
- stable principal identifier and principal type (human, service, or administrative);
- D115 scope and permitted operation/resource scope;
- issuer/subject or service identity relationship, if OIDC is the mechanism;
- effective date, expiry/revocation owner, and authoritative source.

Missing now: **all D115-specific values**.

### 5.2 Authority fact

Required external evidence:

- an explicit D115 governance/authority act;
- the authority's scope: identity resolution, binding approval, runtime qualification,
  production activation, or another narrowly defined role;
- decision/reference identifier and effective date;
- explicit separation from gate acceptance, certification, and production activation.

Missing now: **the D115-scoped act and its authority identity**.

### 5.3 Custodian fact

Required external evidence:

- accountable runtime identity custodian (team/role and, where applicable, service principal);
- responsibility for directory/claim mapping, company binding, rotation/revocation, audit, and
  incident handling;
- environment scope and separation of test/certification/production responsibility.

Missing now: **a designated custodian**. `SecuredExecutor` is a technical boundary, not this
accountability record.

### 5.4 HDFC Life / D115 company fact

Required external evidence:

- exact authoritative `companyId` literal;
- HDFC Life/D115 company or issuer record from the owning authority;
- canonical issuer/security relationship and effective date/window;
- source authority, mapping method, confidence, mapping version, approval reference, and audit
  reference;
- confirmation that this is the intended CSIP/company boundary value and not a provider symbol,
  ticker, sector label, display name, or synthetic fixture value.

Missing now: **the exact value and its authority evidence**.

The P04 contract expressly prohibits string munging, convention-based derivation, silent coercion,
and unapproved mappings (`docs/d4/D4_05_SECURITY_MASTER_ADAPTER.md:100-117`).

### 5.5 Environment fact

Required external evidence:

- explicit environment: development, test, certification, or production;
- environment-specific tenant/region/data-residency boundary;
- environment-specific provider entitlement and IdP relationship;
- deployment/resource identifier sufficient to prove the binding is not inherited from another
  environment.

Missing now: **the D115 runtime environment**. Production is not a default and is not authorized.

### 5.6 OIDC / Keycloak qualification evidence

Required for a live qualification, after the environment and authority are supplied:

- discovery document from the selected environment;
- issuer and audience/client match;
- JWKS retrieval and cryptographic signature verification;
- expiry and required claim validation;
- authoritative subject-to-tenant mapping;
- role/grant mapping and server-side deny tests;
- sanitized run identifier, timestamp, environment, and evidence digest;
- no bearer token, credential, private key, or secret in the repository or report.

The repository's live test is explicitly skipped when Keycloak is unavailable
(`frontend/server/live/live-tenant-engine.test.ts:15-16,37-49,72-84`). Therefore the presence of
that test is not live D115 qualification.

### 5.7 Stage 3 identity artifact

Required external and engineering evidence:

- a D115-specific artifact identifier and source authority;
- the principal, custodian, company/security mapping version, and environment bound to the Stage 3
  execution context;
- execution/provenance record showing the binding was consumed by the governed path;
- negative evidence for absent, ambiguous, unapproved, cross-environment, expired, or invalid
  identity.

Missing now: **the D115 Stage 3 artifact and its authoritative inputs**. The generic P11 Stage 3
result only records the data ingress/execution path (`p11/src/engineIngressPath.js:197-225`).

---

## 6. Exact external authority action required

| Missing fact | Exact authority action | Required output | What the action must not do |
|---|---|---|---|
| Existing-IIPS principal | Existing-IIPS authority supplies and authenticates the organizational/service-principal record | Stable principal ID/type, scope, source, effective/revocation data | Must not infer identity from repository ownership, commit authorship, or a generic `existing-IIPS` label |
| D115 governance authority | D115/Program authority issues a scoped, traceable authority act | Named authority/role, D115 scope, decision ID, date, limits, and explicit non-authorization of production unless separately granted | Must not silently reuse a P11/P15/P16 acceptor or conflate approval with certification/activation |
| Runtime custodian | Operations/identity authority designates the accountable custodian and service-principal owner | Custodian role/team, environment scope, rotation/revocation/audit duties, escalation path | Must not be assigned by the engineer or inferred from the class that performs enforcement |
| HDFC Life/D115 `companyId` | HDFC Life/D115 data or business authority certifies the exact company record and target value | Exact literal, canonical relationship, effective date, source, and approval/audit reference | Must not supply a guessed, derived, synthetic, sector, ticker, or fixture value |
| Company/Security mapping | The authorized identity authority approves the mapping record | Mapping version and all P04 required fields, including approval and audit references | Must not be entered into a runtime register before approval evidence exists |
| Environment | Environment owner declares the target environment and boundary | Explicit environment, tenant/region, deployment/resource identity, provider/IdP boundary | Must not use local defaults or allow production to be inferred from a live-looking configuration |
| OIDC/Keycloak | IdP/environment operator provides sanitized metadata and conducts the environment-appropriate qualification | Discovery/issuer/JWKS/audience evidence, test result, and run digest; secrets remain external | Must not create credentials, tokens, realms, users, roles, or records as part of this assessment |
| Dhan route | Provider/licensing authority confirms the Dhan Level-1 route and entitlement boundary | Provider identity, supported scope, environment, entitlement and qualification evidence | Must not use the historical NSE repository act as Dhan evidence; NSE remains deferred for this assessment |
| Stage 3 artifact | D115 authority supplies or approves the artifact definition and evidence owner | Artifact ID, required binding fields, evidence owner, retention/audit location, and acceptance criteria | Must not label the generic P11 Stage 3 result as D115 identity evidence |

The authority packet may contain references to external secret locations, but must not place
credential values, bearer tokens, private keys, or secret material in this repository.

---

## 7. Exact repository implementation work after the facts are supplied

No item in this section is authorized or performed by this assessment. These are the bounded
engineering activities that can be executed **only after** the corresponding authority evidence
exists and a separate implementation authorization is issued.

### 7.1 Evidence intake and binding record

1. Add a D115 follow-up evidence record in `docs/` that cites the supplied authority artifacts,
   principal, custodian, exact `companyId`, environment, mapping version, and qualification run.
2. Record external references and digests only; keep credentials, tokens, private keys, and secret
   values outside the repository.
3. Preserve the distinction between authority evidence, qualification evidence, implementation
   evidence, certification, and activation.

### 7.2 Governed Company/Security mapping

1. Add the approved D115 mapping to the existing governed mapping surface used by the relevant
   runtime (the current generic surface is `p05/src/identity.js` and its fixture-backed register),
   or to an explicitly authorized replacement selected by the D115 implementation act.
2. Populate every required mapping attribute: canonical security ID, canonical issuer ID, target
   `companyId`, mapping version, effective window, method, source/provider, confidence,
   `approvalRef`, and `auditRef`.
3. Reuse `MappingRegister`/P04 semantics; do not create a second identity authority.
4. Preserve `NormalizedHolding.companyId` and the certified CSIP boundary. The P04 contract says
   that boundary is unchanged (`docs/d4/D4_05_SECURITY_MASTER_ADAPTER.md:121-144`).
5. Ensure absent, ambiguous, overlapping, expired, or unapproved D115 mappings raise the existing
   explicit fail-closed identity outcome; never synthesize a `companyId`.
6. Add deterministic positive and negative tests and a mapping evidence artifact. Do not claim
   acceptance or certification from test execution alone.

### 7.3 Runtime identity and OIDC binding

1. Supply the environment-specific OIDC metadata through the existing configuration seam, with no
   secret in source or committed configuration.
2. Bind the externally verified subject to the authoritative tenant/custodian directory rather
   than accepting a client/URL-supplied tenant. The existing server boundary is
   `frontend/server/secured-executor.ts:34-43`.
3. Replace/parameterize only the fixture directory for the authorized D115 environment; do not
   promote `ADMIN_DIRECTORY` values or the live-test users into D115 identity evidence.
4. Preserve the existing `KeycloakSessionValidator` and `RealKeycloakVerifier` checks for issuer,
   audience, expiry, and JWKS signature (`frontend/src/core/auth/keycloakAdapter.ts:35-55`;
   `frontend/server/live/real-oidc-verifier.ts:46-96`).
5. Add environment-qualified tests for valid, invalid, expired, wrong-audience, wrong-issuer,
   wrong-tenant, wrong-role, and absent-principal cases. The default for an unavailable or
   unevaluable environment remains deny.

### 7.4 D115 Stage 3 and Company/Security execution binding

1. Define the D115 Stage 3 artifact under the supplied authority act, including the binding record
   and mapping-version reference.
2. Carry the approved mapping version and environment reference as governed provenance/metadata;
   do not put security credentials or bearer tokens in canonical data fields or replay identity.
3. Connect the identity binding to the already governed Company/Security resolution path; do not
   bypass P04/P05 or add a provider-search shortcut. The P12 contract requires resolution through
   the P04 adapter and fail-closed unresolved handling (`p12/src/objectResolutionContract.js:101-115,122-179`).
4. Add an evidence-bearing Stage 3 execution trace and negative tests proving no execution occurs
   when the principal, authority, custodian, companyId, mapping approval, or environment is
   absent/ambiguous.

### 7.5 Qualification and later governance

1. Run the live OIDC/Keycloak qualification only in the externally designated environment, using
   externally managed credentials and tokens.
2. Record the sanitized qualification evidence and test digest in the governed documentation
   location.
3. Obtain the separate D115 acceptance/qualification decision, if required by the authority.
4. Keep production activation separate. The repository's P03 rules require explicit environment
   separation (`docs/p03/P03_SECRET_CONFIGURATION_REQUIREMENTS.md:62-72`), and existing phase
   records state that production activation is not authorized (`docs/PHASE_11_GATE_ACCEPTANCE.md:93-97`).

### Explicitly not authorized by this report

- no application code change;
- no `companyId` entry;
- no principal, custodian, realm, user, role, token, credential, or secret creation;
- no Keycloak provisioning;
- no provider onboarding or licensed acquisition;
- no production identity enablement;
- no production authorization;
- no change to `NormalizedHolding`, CSIP, Existing-IIPS methodology, scoring, calibration,
  taxonomy, replay, or accepted product gates;
- no reopening of historical NSE or phase acceptance records.

---

## 8. Explicit source separation

### 8.1 Repository evidence

The repository establishes:

- `existing-IIPS` is an external/Existing-IIPS ownership boundary for M-5, not a principal
  identifier (`docs/p03/P03_OPEN_ITEMS.md:25-33,41-51`);
- generic A1 clearance has no named individual and does not itself decide D115 content
  (`docs/p00/P00_AUTHORITY_REGISTER.md:37-45`);
- the technical runtime identity seam is server-side OIDC validation → governed principal →
  tenant validation → authorization/audit (`frontend/server/secured-executor.ts:1-43`);
- the P04 mapping is explicit, versioned, auditable, effective-dated, and fail-closed
  (`docs/d4/D4_05_SECURITY_MASTER_ADAPTER.md:85-117`);
- `companyId` is a certified boundary join key and existing values described in the repository are
  synthetic sector labels, not authoritative HDFC Life identity (`docs/d4/D4_05_SECURITY_MASTER_ADAPTER.md:13-25,121-144`);
- live Keycloak qualification is conditional, environment-dependent, and skipped when unavailable
  (`frontend/server/live/live-tenant-engine.test.ts:15-16,42-49,72-84`);
- generic P11 Stage 3 is a data ingress/execution result, not a D115 identity artifact
  (`p11/src/engineIngressPath.js:197-225`).

### 8.2 Externally supplied authority evidence required

None of the following is present in the repository and none is asserted by this report:

- the authoritative Existing-IIPS organizational/service principal;
- the D115 governance authority;
- the runtime identity custodian;
- the HDFC Life/D115 `companyId`;
- the D115 environment and its authoritative OIDC binding;
- the D115 Stage 3 identity artifact;
- provider/licensing evidence for the active Dhan route;
- a D115 approval/audit reference for the Company/Security mapping.

### 8.3 Inference permitted by this report

Only bounded technical inferences are made:

- the repository can support a future D115 binding without changing the CSIP `companyId` type,
  provided an approved mapping is supplied;
- the current server architecture has a place to enforce a future verified identity;
- the current contracts require denial when the required evidence is absent.

These are engineering consequences, not identity values, authority decisions, or qualification
results.

### 8.4 Unresolved items

All D115-specific values in the mapping table remain unresolved. The fail-closed boundary remains
in force until authoritative evidence is supplied and separately authorized engineering and
qualification work is completed.

---

## 9. Provider-route reconciliation: Dhan active / NSE deferred

This assessment follows the requested operational constraint: **Dhan is the active Level-1
market-data route for this D115 assessment; NSE is deferred.**

However, the repository independently contains historical/current-looking NSE selection artifacts,
including:

- `docs/PHASE_07_O3_ACT_B_SELECTION.md:1-13`, which records NSE as a provider-selection act;
- `p07/src/providerReconciliation.js:83-101` and
  `p07/tests/providerReconciliation.test.js:145-159`, which encode/test NSE selection.

There is no Dhan repository reference. Therefore:

- Dhan is **USER-PROVIDED INPUT / EXTERNAL-AUTHORITY**, not repository-qualified evidence;
- NSE is **historical/conflicting repository evidence**, not the active route for this assessment;
- this report does not edit, reopen, revoke, or reinterpret the NSE artifacts;
- a future durable Dhan repository record requires a separate authority action and bounded
  provider-route reconciliation; it must not be smuggled into this identity assessment;
- provider route selection does not establish the principal, custodian, companyId, or OIDC
  environment in any event.

---

## 10. D115 identity unblock criteria

D115 may leave the identity-blocked state only when **all** applicable criteria below are met and
recorded. A committed document alone is not sufficient.

| Criterion | Required evidence | Gate state before evidence |
|---|---|---|
| **U-01 Principal identified** | Authoritative Existing-IIPS organizational/service principal record with stable ID/type/scope/effective data | **BLOCKED** |
| **U-02 Authority identified** | D115-scoped governance/authority act with explicit limits and reference | **BLOCKED** |
| **U-03 Custodian designated** | Runtime identity custodian and service-principal ownership record, including environment duties | **BLOCKED** |
| **U-04 Company ID resolved** | HDFC Life/D115 authority certifies exact `companyId`; no derivation or placeholder | **BLOCKED** |
| **U-05 Company/Security mapping approved** | P04-shaped mapping record with canonical IDs, target `companyId`, effective window, method, source, version, approval, audit reference | **BLOCKED** |
| **U-06 Environment explicit** | Named dev/test/certification/prod target and isolated tenant/region/deployment boundary | **BLOCKED** |
| **U-07 OIDC qualified** | Environment-specific discovery, issuer/audience, JWKS signature, expiry/claim, subject-to-tenant, RBAC, and deny evidence | **BLOCKED** |
| **U-08 Provider route qualified** | Dhan route and entitlement/access evidence for the intended environment; NSE remains deferred | **BLOCKED** |
| **U-09 Stage 3 artifact bound** | D115-specific Stage 3 artifact links principal, authority, custodian, mapping version, and environment | **BLOCKED** |
| **U-10 Fail-closed negatives pass** | Missing/ambiguous/unapproved/cross-environment/invalid identity produces denial and no Company/Security data | **BLOCKED** |
| **U-11 Implementation authorization exists** | Separate authority act authorizes exactly the required repository code/config/test work | **BLOCKED** |
| **U-12 Qualification/acceptance decision exists** | Separate D115 qualification/acceptance record, if required | **BLOCKED** |
| **U-13 Production authorization exists** | Separate downstream production activation decision; never inferred from U-01…U-12 | **NOT AUTHORIZED** |

**Important:** U-01 through U-12 do not, by themselves, authorize production. U-13 remains a
separate control.

---

## 11. Recommended next executable action

### Next action: authority packet, not engineering implementation

The exact next executable action is for the authorized D115/Existing-IIPS authority chain to issue
a **D115 identity authority packet** containing, at minimum:

1. the authoritative Existing-IIPS organizational/service principal;
2. the D115 governance authority act and scope;
3. the runtime identity custodian designation;
4. the exact HDFC Life/D115 `companyId` and its approved canonical company/security mapping;
5. the explicit target environment and tenant/region boundary;
6. sanitized OIDC/Keycloak discovery metadata and an environment-specific qualification owner;
7. the D115 Stage 3 artifact definition and evidence owner;
8. Dhan Level-1 route/entitlement evidence, with NSE left deferred.

The packet must be supplied through an authoritative, traceable channel. It must not include secret
values in this repository. **Until that packet exists, the engineering action is to preserve the
fail-closed boundary and do no identity binding.**

After the packet is accepted and a separate implementation act is issued, the next engineering
action is to add the approved, versioned, auditable D115 mapping and its server-side qualification
coverage using the existing P04/P05 and OIDC/Keycloak boundaries. No production switch follows
from that work.

---

## 12. Assessment result

```text
D115 IDENTITY RESOLUTION = BLOCKED
```

**Exact next authority action:** issue the traceable D115 identity authority packet described in
§11, including the real principal, D115 authority, runtime custodian, exact HDFC Life/D115
`companyId`, explicit environment, and Dhan route/qualification owner.  

**Exact next engineering action after that packet and separate implementation authorization:**
record and test the approved P04-shaped Company/Security mapping and environment-qualified
server-side OIDC binding, preserving fail-closed behavior and without enabling production.

---

## 13. Durability note

This report is intended to be committed and pushed as documentation only. The final commit SHA,
remote SHA, equality check, and clean-worktree result are recorded in the turn's durability
checkpoint after the commit/push operation. Those Git facts prove report durability only; they do
**not** prove D115 identity qualification or production authorization.
