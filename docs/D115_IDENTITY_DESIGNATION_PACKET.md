# D115 IDENTITY DESIGNATION PACKET

**Packet ID:** `D115-ID-DESIGNATION-PACKET-001`
**Prepared:** 2026-09-22
**Prepared for:** Ramki, holder of `D115-AUTHORITY-001`
**Authority basis:** `docs/D115_AUTHORITY_ACT.md:13-38`
**Prior authority checkpoint:** `ecfa2199ee3d6cc3999eb6835fde490251ddf987`
**Current authority state:** `D115 AUTHORITY = PARTIALLY ESTABLISHED`
**Current identity state:** `D115 IDENTITY RESOLUTION = BLOCKED`

> This packet is prepared for explicit completion by Ramki. It contains no guessed identity values.
> It is not an identity binding, D115 qualification, implementation authorization, production
> authorization, credential record, Keycloak provisioning act, provider entitlement, or production
> promotion.

---

## 1. Completion rule

Ramki may complete the authority decisions within the scope of `D115-AUTHORITY-001`, but each
actual value and each subordinate designation must be supported by a separate, traceable evidence
record. A designation of authority is not the same as the identity value, evidence of that value,
or implementation authorization.

The packet therefore records four separate controls:

| Control | Meaning | Current state |
|---|---|---|
| **1. AUTHORITY DESIGNATION** | Ramki is authorized to designate/approve the bounded D115 identity controls listed in the authority act. | **ESTABLISHED** by `D115-AUTHORITY-001` |
| **2. IDENTITY VALUE** | The actual principal, custodian, `companyId`, mapping, environment, tenant/region, Stage-3, and OIDC values. | **UNRESOLVED**; no value is inferred |
| **3. EVIDENCE OF IDENTITY** | Authoritative records and sanitized, environment-specific evidence that prove the values and their scope. | **UNRESOLVED**; no evidence packet supplied |
| **4. IMPLEMENTATION AUTHORIZATION** | A separate act authorizing exact repository code/configuration/test work after the identity packet is complete. | **NOT GRANTED** |

A committed copy of this packet records the missing decisions and request boundary. It does not
complete the designations.

---

## 2. Identity designation fields for Ramki's explicit completion

| FIELD | CURRENT VALUE | REQUIRED VALUE | SOURCE/EVIDENCE | AUTHORITY DECISION REQUIRED | STATUS |
|---|---|---|---|---|---|
| **A. Existing-IIPS organizational/service principal** | **NOT IDENTIFIED.** The repository contains an `existing-IIPS` ownership/boundary label but no authoritative organizational or service-principal record, stable principal ID, service-account ID, scope, or effective/revocation data. | An authoritative Existing-IIPS organizational/service-principal record containing stable ID/type, accountable owner, scope, effective/revocation data, and the relationship to D115. | `docs/D115_IDENTITY_RESOLUTION_AND_BINDING_RECONCILIATION.md:30-34,95,242-243`; `docs/p03/P03_AUTHENTICATION_MODEL.md:34-37,50`; `docs/p03/P03_OPEN_ITEMS.md:20-23,45-50`. | **Ramki must designate/approve the principal record** within D115 scope. The Existing-IIPS authority must supply the authoritative principal evidence. | **UNRESOLVED — designation and evidence required** |
| **B. Runtime identity custodian** | **NOT DESIGNATED.** `SecuredExecutor`/`TenantDirectory` and the service-side identity seam are technical mechanisms, not an accountable custodian assignment. | A named accountable custodian/team and service-principal owner, with environment scope, rotation, revocation, audit, and escalation duties. | `docs/D115_IDENTITY_RESOLUTION_AND_BINDING_RECONCILIATION.md:97,121,164-173,242,288-302`; `docs/p03/P03_OPEN_ITEMS.md:20-23`; `docs/p03/P03_PROVIDER_ACCESS_SECURITY.md:67-71`. | **Ramki must designate the runtime identity custodian** and approve the ownership record. The responsible operations/identity authority must supply the custodian facts. | **UNRESOLVED — custodian designation required** |
| **C. Exact D115/HDFC Life `companyId`** | **ABSENT.** No HDFC Life/D115 business record exists. Synthetic values such as `Technology-H1` or `Banking-H1`, fixtures, symbols, issuer names, and local/test values are not acceptable substitutes. | The exact authoritative HDFC Life/D115 `companyId`, supplied by the accountable identity/business authority and tied to an effective scope. | `docs/D115_IDENTITY_RESOLUTION_AND_BINDING_RECONCILIATION.md:30-34,98,142-150`; `docs/d4/D4_05_SECURITY_MASTER_ADAPTER.md:13-25,121-144`; `docs/p04/P04_IDENTITY_ADAPTER_CONTRACT.md:59-67`. | **Ramki must approve the supplied exact value as part of the D115 mapping decision.** He must not derive or invent it. | **UNRESOLVED — exact value required** |
| **D. Approved canonical Company/Security mapping** | **NO D115 MAPPING.** The repository supplies a generic P04/P05 mapping contract and fail-closed mechanics only. No D115 canonical identity, target `companyId`, approval reference, or audit record is present. | A stored, canonical, provider-neutral, versioned, effective-dated, auditable mapping containing canonical security/issuer identity, target `companyId`, mapping version, method, source/provider, confidence, approval reference, and audit reference. | `docs/d4/D4_05_SECURITY_MASTER_ADAPTER.md:85-117,199-207`; `docs/p04/P04_IDENTITY_ADAPTER_CONTRACT.md:31-38,69-83,91-107`; `docs/D115_IDENTITY_RESOLUTION_AND_BINDING_RECONCILIATION.md:100,432`. | **Ramki must approve the D115 mapping and its authority/audit reference** after the exact `companyId` and canonical identity evidence are supplied. This is approval only; no code change is authorized by this packet. | **UNRESOLVED — mapping and approval required** |
| **E. Target qualification environment** | **NOT SPECIFIED.** Local OIDC defaults and conditional live-discovery code do not select a D115 qualification environment. Production is not enabled or authorized. | An explicitly named qualification environment and deployment target, with its identity-provider relationship and qualification scope. The selected target must not be treated as production authorization. | `docs/D115_IDENTITY_RESOLUTION_AND_BINDING_RECONCILIATION.md:99,126,199-207,319-322,433-434`; `docs/D115_AUTHORITY_ACT.md:32,42-48`. | **Ramki must designate the target qualification environment.** The environment operator must supply environment-specific qualification evidence. | **UNRESOLVED — environment designation required** |
| **F. Tenant/region boundary, if applicable** | **NOT SPECIFIED.** No D115 tenant, region, deployment boundary, or cross-tenant qualification record is present. Generic `tenant-A`/`tenant-B` test values are not D115 values. | The exact tenant/region/deployment boundary for the selected qualification environment, or an explicit authoritative `NOT APPLICABLE` determination with rationale. | `docs/D115_IDENTITY_RESOLUTION_AND_BINDING_RECONCILIATION.md:30-34,121,197-207,242-249,433-434`; `docs/p03/P03_SECURITY_AUTH_CONTRACT.md:64-70`; `docs/p03/P03_TENANT_ISOLATION.md` (tenant boundary rules). | **Ramki must designate or approve the boundary determination** within the selected environment. | **UNRESOLVED — boundary decision required** |
| **G. D115 Stage-3 identity artifact** | **ABSENT.** Generic P11 Stage 3 is a data ingress/execution result and is not a D115 organizational identity binding. | A D115-specific Stage-3 artifact definition with an artifact ID, principal, authority, custodian, exact `companyId`, mapping version, environment/tenant boundary, evidence references, retention/audit location, and acceptance criteria. | `docs/D115_IDENTITY_RESOLUTION_AND_BINDING_RECONCILIATION.md:101,227-250,304-315,436`; `p11/src/engineIngressPath.js:184-226` as the generic Stage-3 boundary only. | **Ramki must designate/approve the D115 Stage-3 artifact definition.** A separate implementation or qualification act is required before execution evidence can be produced. | **UNRESOLVED — artifact definition required** |
| **H. Stage-3 evidence owner** | **NOT DESIGNATED.** No D115 Stage-3 evidence owner, accountable team, retention owner, or audit location is named. | A named person/team accountable for producing, retaining, auditing, and presenting the D115 Stage-3 identity evidence. | `docs/D115_IDENTITY_RESOLUTION_AND_BINDING_RECONCILIATION.md:101,227-250,368-375,436`; `docs/D115_AUTHORITY_ACT.md:33-38,65`. | **Ramki must designate the Stage-3 evidence owner** and the evidence-retention/audit location. | **UNRESOLVED — evidence-owner designation required** |
| **I. Sanitized OIDC issuer/discovery information** | **NOT QUALIFIED for D115.** OIDC/server verifier seams exist, but no selected D115 environment, issuer, discovery response, JWKS evidence, audience, or qualification run is present. | Sanitized, environment-specific discovery evidence including issuer, discovery endpoint/response metadata, JWKS URI/verification metadata, audience/claims requirements, timestamps, and qualification digest. No secrets, private keys, bearer tokens, or credential values. | `docs/D115_IDENTITY_RESOLUTION_AND_BINDING_RECONCILIATION.md:45-47,99,126,288-322,434`; `frontend/server/admin-transport.ts:276-310`; `frontend/server/real-oidc-verifier.ts:46-96`. | **Ramki may request and validate the sanitized OIDC evidence** after E and F are designated. The IdP/environment operator must supply it. | **UNRESOLVED — sanitized evidence and qualification required** |
| **J. OIDC realm/tenant/client identity, where applicable** | **NOT IDENTIFIED.** No D115 realm, tenant, client ID, audience, or environment-bound client record is present. Local defaults are not authoritative D115 identity. | Non-secret realm/tenant/client identifiers bound to the selected qualification environment, with issuer/audience relationship and applicable tenant scope. Secret material must remain external. | `docs/D115_IDENTITY_RESOLUTION_AND_BINDING_RECONCILIATION.md:30-34,99,126,288-322,434`; `docs/p03/P03_AUTHENTICATION_MODEL.md:34-67`; `docs/D115_AUTHORITY_ACT.md:34-38`. | **Ramki may request and validate the non-secret OIDC identity metadata**; the IdP/environment operator must supply the authoritative values. | **UNRESOLVED — environment-bound OIDC identity required** |

---

## 3. Explicit Ramki completion decisions

Ramki's completion act must address each item without deriving values from repository artifacts:

- **A:** accept or reject the supplied Existing-IIPS principal record;
- **B:** designate the runtime identity custodian and service-principal owner;
- **C:** approve the exact externally supplied D115/HDFC Life `companyId`;
- **D:** approve the canonical Company/Security mapping and its version/audit reference;
- **E:** designate the qualification environment;
- **F:** designate the tenant/region boundary or explicitly record why it is not applicable;
- **G:** designate/approve the D115 Stage-3 identity artifact definition;
- **H:** designate the Stage-3 evidence owner and retention/audit location;
- **I:** request and validate sanitized, environment-specific OIDC discovery evidence; and
- **J:** request and validate the applicable non-secret realm/tenant/client identity.

For each completed item, Ramki's record must identify the subject, scope, effective date,
environment, evidence reference, and any approval/audit reference. A `NOT APPLICABLE` decision must
be explicit and reasoned; silence is not a value.

---

## 4. Separation from implementation authorization

This packet does **not** authorize any of the following:

- application-code, configuration, test, fixture, or schema changes;
- OIDC/Keycloak provisioning or creation of realms, clients, users, roles, tokens, or credentials;
- production activation or production promotion;
- NSE authorization;
- Dhan commercial entitlement or provider onboarding; or
- modification or reopening of accepted/certified product gates.

A separate implementation authority act is required after the identity designations and evidence
are complete. A separate qualification/acceptance act may also be required. Production remains a
separate downstream control.

---

## 5. Provider-route preservation

Dhan remains the active Level-1 route for this packet because it is the supplied operational
constraint. The repository has no Dhan provider, entitlement, commercial, credential, or
qualification evidence. This packet does not create or authorize any of those items.

Historical NSE selection artifacts remain preserved and **DEFERRED**. This packet does not authorize,
replace, reopen, or reinterpret NSE.

---

## 6. Packet status

```text
PACKET STATUS                         = OPEN — RAMKI COMPLETION REQUIRED
AUTHORITY DESIGNATION                 = ESTABLISHED (RAMKI)
IDENTITY VALUES                      = UNRESOLVED
IDENTITY EVIDENCE                    = UNRESOLVED
IMPLEMENTATION AUTHORIZATION         = NOT GRANTED
D115 AUTHORITY                       = PARTIALLY ESTABLISHED
D115 IDENTITY RESOLUTION             = BLOCKED
```

No actual identity value is asserted by this packet.

---

## 7. A–H designation / approval record

This section records the requested A–H completion form. The reference identifiers supplied with the
request are retained only as **references requiring verification**; they are not promoted into
identity values or approvals. No A–H subordinate designation has been completed by this packet.

### A. Existing-IIPS organizational / service principal

**VALUE:**

UNRESOLVED — AUTHORITY DESIGNATION REQUIRED

**AUTHORITY STATUS:** Ramki is the bounded D115 authority holder; the exact Existing-IIPS principal
and owning organization/team have not been designated.

**SOURCE / EVIDENCE:** No authoritative principal identifier/name or Existing-IIPS source record is
present in the governed evidence. `docs/D115_IDENTITY_RESOLUTION_AND_BINDING_RECONCILIATION.md:30-34,95,242-243`
and `docs/p03/P03_AUTHENTICATION_MODEL.md:34-37,50` preserve this absence.

**APPROVED BY:** Not approved. Ramki must explicitly designate the exact principal and owning
organization/team.

**SCOPE:** D115 identity binding / Stage-3 qualification only unless Ramki separately records a
broader scope.

**EFFECTIVE VERSION/DATE:** Not established.

### B. Runtime identity custodian

**VALUE:**

UNRESOLVED — AUTHORITY DESIGNATION REQUIRED

**AUTHORITY STATUS:** Runtime identity custody and lifecycle ownership have not been designated.

**SOURCE / EVIDENCE:** The repository contains technical identity-enforcement seams, not a named
custodian or service-principal owner. `docs/D115_IDENTITY_RESOLUTION_AND_BINDING_RECONCILIATION.md:97,121,164-173,242,288-302`
and `docs/p03/P03_OPEN_ITEMS.md:20-23`.

**APPROVED BY:** Not approved. Ramki must designate the team, person, or system and the approved
custody/lifecycle mechanism. No secret value may be recorded.

**SCOPE:** Runtime identity custody for the designated D115 qualification boundary only.

**EFFECTIVE VERSION/DATE:** Not established.

### C. D115 companyId

**VALUE:**

UNRESOLVED — AUTHORITY DESIGNATION REQUIRED

**AUTHORITY STATUS:** No exact authoritative HDFC Life/D115 `companyId` has been approved.

**SOURCE / EVIDENCE:** The supplied CSIP reference
`5233149d-2a2d-4644-a6a7-e1ed5e133285` is retained as **REFERENCE ONLY — NOT APPROVED as
`runtimeCompanyId`**. The governed report records no HDFC Life/D115 business value and prohibits
synthetic or guessed substitutions. `docs/D115_IDENTITY_RESOLUTION_AND_BINDING_RECONCILIATION.md:30-34,98`
and `docs/d4/D4_05_SECURITY_MASTER_ADAPTER.md:13-25,121-144`.

**APPROVED BY:** Not approved. Ramki must approve the exact value from authoritative source evidence.

**SCOPE:** Exact D115/HDFC Life company identity for the designated qualification boundary.

**EFFECTIVE VERSION/DATE:** Not established.

### D. Company / Security mapping

**VALUE:**

UNRESOLVED — AUTHORITY DESIGNATION REQUIRED

**AUTHORITY STATUS:** No D115 Company → canonical issuer → security mapping has been approved.

**SOURCE / EVIDENCE:** The following supplied identifiers are retained as **REFERENCES REQUIRING
VERIFICATION**, not as authoritative values:

- canonical issuer: `008e9766-4135-4d5b-9ecf-b3fcf721ebdb`;
- security: `7c4322d5-6f87-4dc8-a0a9-1b5f937cb0b1`; and
- mapping reference: `idmap-d115-group2-1.0.0`.

The P04 contract requires an explicit, provider-neutral, versioned, effective-dated, auditable
mapping with approval and audit references. `docs/p04/P04_IDENTITY_ADAPTER_CONTRACT.md:31-38,69-83,91-107`
and `docs/d4/D4_05_SECURITY_MASTER_ADAPTER.md:85-117`.

**APPROVED BY:** Not approved. Ramki must explicitly verify and approve the canonical relationship
and mapping artifact/version.

**SCOPE:** D115 Company → issuer → security relationship for identity binding / Stage-3
qualification only.

**EFFECTIVE VERSION/DATE:** Not established. `idmap-d115-group2-1.0.0` is not accepted as a
mapping version merely because it was supplied.

### E. Target environment

**VALUE:**

UNRESOLVED — AUTHORITY DESIGNATION REQUIRED

**AUTHORITY STATUS:** No D115 qualification environment has been designated.

**SOURCE / EVIDENCE:** `D115_STAGE3_BOUNDED_DEVELOPMENT_REFERENCE_ONLY` is retained as
**REFERENCE ONLY — NOT an authorization**. Local OIDC defaults and conditional live-discovery code
do not select an environment. `docs/D115_IDENTITY_RESOLUTION_AND_BINDING_RECONCILIATION.md:99,126,199-207,319-322,433-434`
and `docs/D115_AUTHORITY_ACT.md:32,42-48`.

**APPROVED BY:** Not approved. Ramki must designate the exact qualification environment. Production
activation and production promotion remain outside scope.

**SCOPE:** Initial D115 Stage-3 identity qualification only.

**EFFECTIVE VERSION/DATE:** Not established.

### F. Tenant / region / environment boundary

**VALUE:**

UNRESOLVED — AUTHORITY DESIGNATION REQUIRED

**AUTHORITY STATUS:** No D115 tenant, region, or environment boundary has been designated or
validated.

**SOURCE / EVIDENCE:** No authoritative D115 boundary record exists. Generic test tenants, source
defaults, local configuration, unrelated Keycloak instances, and historical environments are not
D115 evidence. `docs/D115_IDENTITY_RESOLUTION_AND_BINDING_RECONCILIATION.md:30-34,121,197-207,242-249,433-434`
and `docs/p03/P03_SECURITY_AUTH_CONTRACT.md:64-70`.

**APPROVED BY:** Not approved. Ramki must designate or explicitly validate the tenant, region, and
environment boundary, including an explicit `NOT APPLICABLE` decision if appropriate.

**SCOPE:** The designated non-production qualification boundary, if applicable.

**EFFECTIVE VERSION/DATE:** Not established.

### G. Stage-3 identity artifact

**VALUE:**

UNRESOLVED — AUTHORITY DESIGNATION REQUIRED

**AUTHORITY STATUS:** No governed D115 Stage-3 identity artifact, type, identifier, path, or version
has been designated.

**SOURCE / EVIDENCE:** Generic P11 Stage 3 is an execution/data-ingress result and is not a D115
identity-binding artifact. `docs/D115_IDENTITY_RESOLUTION_AND_BINDING_RECONCILIATION.md:101,227-250,304-315,436`
and `p11/src/engineIngressPath.js:184-226`. No artifact may be created, modified, registered,
loaded, or activated from this packet.

**APPROVED BY:** Not approved. Ramki must explicitly designate the artifact type, identifier,
governed location, version/hash, and approval reference.

**SCOPE:** D115 Stage-3 identity binding qualification only.

**EFFECTIVE VERSION/DATE:** Not established.

### H. Evidence owner

**VALUE:**

UNRESOLVED — AUTHORITY DESIGNATION REQUIRED

**AUTHORITY STATUS:** No D115 Stage-3 evidence owner or accountable evidence team has been
designated.

**SOURCE / EVIDENCE:** The required owner and retention/audit location are absent from the governed
evidence. `docs/D115_IDENTITY_RESOLUTION_AND_BINDING_RECONCILIATION.md:101,227-250,368-375,436`
and `docs/D115_AUTHORITY_ACT.md:33-38,65`.

**APPROVED BY:** Not approved. Ramki must designate the owner role and responsibility for maintaining
authoritative evidence proving A–G.

**SCOPE:** Evidence production, retention, audit, and presentation for the D115 Stage-3
qualification packet.

**EFFECTIVE VERSION/DATE:** Not established.

---

## 8. Authority decision record

Ramki's authority to complete the bounded A–H decisions is established by
`D115-AUTHORITY-001`. This packet does **not** impersonate Ramki, complete a subordinate designation,
or convert any supplied reference into an approved identity value.

Until every required field has an authoritative value:

```text
runtimeCompanyId          = UNRESOLVED
implementationAuthority  = WITHHELD
productionEligible       = false
D115 production activation = NOT AUTHORIZED
```

No D115 mapping creation, registration, loading, activation, or production operation may proceed
solely from inferred or repository-derived values.

Dhan remains the active Level-1 route as a supplied operational constraint; the repository contains
no Dhan entitlement evidence. NSE remains **DEFERRED** and is not authorized by this packet.

---

## 9. A–H record disposition

```text
A. Organizational/service principal = UNRESOLVED — AUTHORITY DESIGNATION REQUIRED
B. Runtime identity custodian       = UNRESOLVED — AUTHORITY DESIGNATION REQUIRED
C. D115 companyId                   = UNRESOLVED — AUTHORITY DESIGNATION REQUIRED
D. Company/Security mapping          = UNRESOLVED — AUTHORITY DESIGNATION REQUIRED
E. Target environment               = UNRESOLVED — AUTHORITY DESIGNATION REQUIRED
F. Tenant/region boundary            = UNRESOLVED — AUTHORITY DESIGNATION REQUIRED
G. Stage-3 identity artifact         = UNRESOLVED — AUTHORITY DESIGNATION REQUIRED
H. Evidence owner                   = UNRESOLVED — AUTHORITY DESIGNATION REQUIRED

D115 AUTHORITY                       = PARTIALLY ESTABLISHED
D115 IDENTITY RESOLUTION             = BLOCKED
```

---

## 10. Next authority act result — A–H designation completion

**Act ID:** `D115-AUTHORITY-002`
**Authority holder:** Ramki
**Act result:** No authoritative A–H designation or approval was supplied with this act.

The existing packet, the governed repository evidence, and the current authority instruction do not
supply authoritative identity values for A–H. The following references therefore remain withheld and
are not promoted:

- the CSIP UUID is not promoted to `runtimeCompanyId`;
- the canonical issuer UUID and security UUID are not approved;
- `idmap-d115-group2-1.0.0` is not accepted as an authoritative mapping version; and
- `D115_STAGE3_BOUNDED_DEVELOPMENT_REFERENCE_ONLY` is not converted into environment authorization.

### Updated A–H designation record

| FIELD | VALUE | AUTHORITY STATUS | SOURCE / EVIDENCE | APPROVED BY | SCOPE | EFFECTIVE VERSION/DATE |
|---|---|---|---|---|---|---|
| **A. Existing-IIPS organizational/service principal** | **UNRESOLVED — AUTHORITY DESIGNATION REQUIRED** | Ramki's D115 authority holder status exists; subordinate principal designation is not supplied. | No authoritative principal/team record in the governed evidence; prior packet §7A remains controlling. | Not approved. | D115 identity binding / Stage-3 qualification only. | Not established. |
| **B. Runtime identity custodian** | **UNRESOLVED — AUTHORITY DESIGNATION REQUIRED** | No custodian, owner, or custody mechanism designation supplied. | Technical runtime seams do not identify an accountable custodian; prior packet §7B remains controlling. | Not approved. | D115 qualification boundary only. | Not established. |
| **C. Exact D115/HDFC Life companyId** | **UNRESOLVED — AUTHORITY DESIGNATION REQUIRED** | No exact authoritative companyId approval supplied. | The supplied CSIP UUID remains reference-only and is not `runtimeCompanyId`. | Not approved. | Exact D115/HDFC Life identity only. | Not established. |
| **D. Approved Company/Security canonical mapping** | **UNRESOLVED — AUTHORITY DESIGNATION REQUIRED** | No mapping approval, mapping version, or audit reference supplied. | The supplied issuer UUID, security UUID, and `idmap-d115-group2-1.0.0` remain verification references only. | Not approved. | D115 Company → issuer → security relationship only. | Not established. |
| **E. Authorized initial qualification environment** | **UNRESOLVED — AUTHORITY DESIGNATION REQUIRED** | No environment designation supplied. | The development reference remains reference-only and is not an authorization. | Not approved. | Initial D115 Stage-3 qualification only. | Not established. |
| **F. Tenant/region/environment boundary** | **UNRESOLVED — AUTHORITY DESIGNATION REQUIRED** | No tenant, region, or boundary validation supplied. | No authoritative D115 boundary evidence; generic/default/historical environments remain excluded. | Not approved. | Designated qualification boundary only. | Not established. |
| **G. Exact governed Stage-3 identity artifact** | **UNRESOLVED — AUTHORITY DESIGNATION REQUIRED** | No artifact type, identifier, governed path, version, or hash designated. | Generic P11 Stage 3 is not a D115 identity artifact; no D115 artifact is supplied. | Not approved. | D115 Stage-3 identity qualification only. | Not established. |
| **H. Evidence owner** | **UNRESOLVED — AUTHORITY DESIGNATION REQUIRED** | No evidence owner, role, retention location, or audit responsibility designated. | No authoritative D115 evidence-owner record supplied. | Not approved. | A–G evidence production, retention, audit, and presentation. | Not established. |

### Authority-blocked result

Because no authoritative designation was supplied for any A–H field, this act updates the packet
status only; it does not populate an identity value or authorize implementation.

```text
A–H DESIGNATION COMPLETION       = AUTHORITY-BLOCKED
runtimeCompanyId                 = UNRESOLVED
implementationAuthority         = WITHHELD
productionEligible              = false
D115 production activation      = NOT AUTHORIZED
Dhan commercial entitlement     = NOT AUTHORIZED
NSE                             = DEFERRED
D115 AUTHORITY                  = PARTIALLY ESTABLISHED
D115 IDENTITY RESOLUTION        = BLOCKED
```

No identity implementation, mapping creation, registration, loading, activation, Keycloak change,
credential handling, provider onboarding, production operation, or accepted-gate modification was
performed.

---

## 11. Personal / single-user identity designation update

**Act ID:** `D115-AUTHORITY-003`
**Act type:** Personal/single-user D115 designation preparation and recording
**Authority holder:** Ramki
**Authority input:** Explicit current governance instruction supplied for this update
**Repository investigation:** Completed before this update

### 11.1 Repository investigation result

The repository does not contain an authoritative D115 organizational/service-principal record,
D115-specific Stage-3 identity artifact, D115/HDFC Life `companyId`, approved D115
Company/Security mapping, or authoritative D115 OIDC tenant/realm/client record.

The following discoveries are technical or test references only and are not promoted:

- `frontend/src/core/auth/authContract.ts:28-36` defines a technical governed-application-principal
  interface; it does not identify a D115 principal or owner.
- `frontend/src/core/auth/keycloakAdapter.test.ts:8-10` contains mocked/local Keycloak metadata;
  it is test evidence, not an authoritative D115 provider record.
- `frontend/src/core/auth/oidcClient.ts:67-98` contains local default OIDC configuration; it is not
  an environment designation or D115 qualification evidence.
- `p11/src/engineIngressPath.js:204-219` contains generic execution Stage 3; it is not a D115
  identity-binding artifact.
- The only D115-named files are governance/assessment documents; no pre-existing governed D115
  Stage-3 identity artifact was found.

The personal/single-user architecture below is recorded as an explicit current governance input,
not as a repository discovery. It does not create a new identity-provider principal or environment.

### 11.2 Updated personal/single-user A–H designation record

| FIELD | VALUE | CLASSIFICATION / AUTHORITY STATUS | SOURCE / EVIDENCE | APPROVED BY | SCOPE | EFFECTIVE VERSION/DATE |
|---|---|---|---|---|---|---|
| **A. Existing-IIPS application principal** | **PERSONAL APPLICATION PRINCIPAL** — IIPS personal/local application principal owned by Ramki. **Exact principal identifier: UNRESOLVED — AUTHORITY DESIGNATION REQUIRED** | **CLASSIFICATION DESIGNATED; exact identity unresolved.** This is not called a service principal without an authoritative IdP definition. | Explicit current governance instruction designates the personal-application classification. Repository search found no authoritative D115 principal; `frontend/src/core/auth/authContract.ts:28-36` is only a technical interface. | Ramki designates the classification and owner; no exact identifier approved. | D115 local qualification only. | Classification effective 2026-09-22; exact identity/version not established. |
| **B. Runtime identity custodian** | **RAMKI** — person / sole application owner. Credential values remain excluded. Custody mechanism: **UNRESOLVED — AUTHORITY DESIGNATION REQUIRED** | **CUSTODIAN DESIGNATED; mechanism/evidence unresolved.** No fictional IAM, security, or platform team is introduced. | Explicit current governance instruction. `docs/D115_AUTHORITY_ACT.md:27-38` authorizes the bounded custodian designation; `docs/p03/P03_OPEN_ITEMS.md:20-23` records the prior mechanism gap. | Ramki designated by the current governance instruction; the specific approved local secure-storage mechanism is not approved. | Local personal runtime identity lifecycle, custody, rotation/replacement where applicable, authorization evidence, and revocation/decommissioning. | Custodian designation effective 2026-09-22; mechanism version/date not established. |
| **C. Exact D115/HDFC Life `companyId`** | **UNRESOLVED — AUTHORITY DESIGNATION REQUIRED** | **UNRESOLVED.** The CSIP UUID `5233149d-2a2d-4644-a6a7-e1ed5e133285` remains `REFERENCE ONLY` and is not promoted to `runtimeCompanyId`. | `docs/D115_IDENTITY_RESOLUTION_AND_BINDING_RECONCILIATION.md:30-34,98`; `docs/d4/D4_05_SECURITY_MASTER_ADAPTER.md:13-25,121-144`; the supplied CSIP reference has no authoritative D115 proof. | Not approved. Ramki must approve the exact value from authoritative HDFC Life/D115 evidence. | Exact D115/HDFC Life company identity for local qualification. | Not established. |
| **D. Company/Security canonical mapping** | **UNRESOLVED — AUTHORITY DESIGNATION REQUIRED** | **UNRESOLVED.** The issuer `008e9766-4135-4d5b-9ecf-b3fcf721ebdb`, security `7c4322d5-6f87-4dc8-a0a9-1b5f937cb0b1`, and `idmap-d115-group2-1.0.0` remain `REFERENCE ONLY` pending proof and approval. | `docs/p04/P04_IDENTITY_ADAPTER_CONTRACT.md:31-38,69-83,91-107`; `docs/d4/D4_05_SECURITY_MASTER_ADAPTER.md:85-117`; no evidence explicitly establishes D115 Company → companyId → issuer → security. | Not approved. Ramki must approve an authoritative canonical relationship and mapping artifact/version. | D115 local qualification mapping only. | Not established. |
| **E. Authorized initial qualification environment** | **LOCAL / PERSONAL DEVELOPMENT-QUALIFICATION**; single-user, non-shared, non-deployed. | **DESIGNATED by current governance instruction; no deployment authorization.** This is not staging, cloud, or production. | Explicit current governance instruction. `D115_STAGE3_BOUNDED_DEVELOPMENT_REFERENCE_ONLY` remains `REFERENCE ONLY` and is not itself the authorization. | Ramki designates the initial qualification environment; no production authority is included. | Local IIPS execution and D115 Stage-3 identity qualification only. | Designation effective 2026-09-22; no deployment/version/hash applicable. |
| **F. Tenant/region/environment boundary** | **LOCAL / PERSONAL / SINGLE-USER / NON-DEPLOYED** application boundary. Tenant/provider details: **UNRESOLVED — AUTHORITY DESIGNATION REQUIRED**. Region: **NOT APPLICABLE to the local application boundary unless an authoritative provider region exists**. | **LOCAL APPLICATION BOUNDARY DESIGNATED; provider boundary unresolved.** No shared tenant, production realm, cloud region, or historical environment is inferred. | Explicit current governance instruction. `frontend/src/core/auth/keycloakAdapter.test.ts:8-10` and `frontend/src/core/auth/oidcClient.ts:67-98` are local/test references only, not authoritative D115 tenant/realm evidence. | Ramki designates the local boundary; actual OIDC tenant/realm/region remains unapproved pending authoritative provider evidence. | Single-user local qualification boundary. | Boundary designation effective 2026-09-22; provider tenant/realm/region version/date not established. |
| **G. Governed Stage-3 identity artifact** | **PROPOSED ONLY — D115 Stage-3 Identity Binding Manifest**, containing non-secret metadata. No exact existing artifact, path, version, or hash was found. | **PROPOSAL ONLY; not an approved artifact and not created by this activity.** The generic P11 Stage 3 is not substituted. | Repository investigation: no pre-existing governed D115 Stage-3 artifact. Generic `p11/src/engineIngressPath.js:204-219` is not a D115 identity artifact. | Not approved. Ramki must designate the exact governed artifact before creation, modification, registration, loading, or activation. | D115 Stage-3 identity qualification only. | Not established; proposed artifact has no version/hash. |
| **H. Evidence owner** | **RAMKI** — D115 authority / personal application owner / evidence custodian. | **DESIGNATED by current governance instruction.** Scope is evidence for A–G; no evidence values are thereby approved. | Explicit current governance instruction; `docs/D115_AUTHORITY_ACT.md:33-38,65` permits designation of the Stage-3 evidence owner. | Ramki designated as owner; subordinate evidence remains to be supplied and maintained. | A–G identity qualification evidence, retention, audit, and presentation. | Evidence-owner designation effective 2026-09-22; evidence package version/date not established. |

### 11.3 Designation classification summary

```text
A = DESIGNATED CLASSIFICATION / EXACT PRINCIPAL IDENTIFIER UNRESOLVED
B = DESIGNATED — RAMKI / CUSTODY MECHANISM UNRESOLVED
C = UNRESOLVED — AUTHORITY DESIGNATION REQUIRED
D = UNRESOLVED — AUTHORITY DESIGNATION REQUIRED
E = DESIGNATED — LOCAL / PERSONAL DEVELOPMENT-QUALIFICATION
F = DESIGNATED LOCAL BOUNDARY / PROVIDER TENANT-REALM-REGION UNRESOLVED
G = PROPOSED GOVERNED ARTIFACT ONLY / NOT YET APPROVED OR CREATED
H = DESIGNATED — RAMKI
```

The personal/single-user designation does not convert the application principal into a service
principal, does not create a shared tenant, and does not establish a D115 companyId or
Company/Security mapping. C and D remain the authoritative blocking boundary.

### 11.4 Control separation and non-implementation result

The current update establishes or records only the bounded classifications/designations above:

- **Authority designation:** Ramki remains the D115 authority holder; B, E, the local application
  boundary in F, and H are designated by the current governance instruction; A is classified as a
  personal application principal; G is proposal-only.
- **Identity value:** C and D remain unresolved; A's exact identifier and F's provider details also
  remain unresolved.
- **Evidence of identity:** No principal identifier, companyId, canonical mapping, provider tenant,
  realm, or Stage-3 artifact evidence is approved by this update.
- **Implementation authorization:** withheld. No artifact was created, no mapping was created or
  loaded, and no runtime identity was registered or activated.

```text
runtimeCompanyId          = UNRESOLVED
implementationAuthority  = WITHHELD
productionEligible       = false
D115 production activation = NOT AUTHORIZED
Dhan commercial entitlement = NOT AUTHORIZED
NSE                         = DEFERRED

D115 AUTHORITY             = PARTIALLY ESTABLISHED
D115 IDENTITY RESOLUTION   = BLOCKED
```

No Keycloak modification, client/realm/tenant creation, credential generation, secret storage
change, provider onboarding, Dhan entitlement change, NSE authorization, deployment, production
activation, or accepted-gate modification was performed.
