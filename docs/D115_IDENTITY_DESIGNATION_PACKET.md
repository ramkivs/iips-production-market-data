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
