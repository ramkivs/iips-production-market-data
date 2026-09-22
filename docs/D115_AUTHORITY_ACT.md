# D115 AUTHORITY ACT

**Act ID:** `D115-AUTHORITY-001`
**Act date:** 2026-09-22
**Act type:** Explicit D115 identity-authority designation
**Authority source:** Explicit holder selection supplied for this act in the current governance instruction
**Existing identity disposition:** `D115 IDENTITY RESOLUTION = BLOCKED`

> This is a bounded authority act. It is not D115 qualification, identity binding, production
> authorization, credential or Keycloak provisioning, provider entitlement, or production
> activation. It creates no principal, service account, token, secret, role, or environment state.

## 1. Authority holder

**Ramki** is designated as the holder of the D115 identity authority defined by this act.

This is a new explicit designation and must not be confused with Ramki's earlier P07, P01, P05,
P06, P10, D5/C8, or bounded Program Authority records. Those earlier records remain governed by
their own scopes; this act supplies the separate D115-specific scope below.

## 2. Scope

**D115 identity authority only.**

## 3. Authority includes

Within the D115 identity-authority scope, Ramki may:

- designate the D115 organizational/service principal;
- designate the runtime identity custodian;
- approve the D115 `companyId` / Company-Security mapping;
- designate the target qualification environment;
- designate the D115 Stage-3 identity evidence owner; and
- request and validate sanitized OIDC evidence.

Any subordinate designation or approval must be recorded in a separate, traceable D115 evidence
record with its exact subject, scope, environment, effective date, and audit reference. No secret
value may be placed in the repository.

## 4. Authority does not include

This act does **not** grant authority for:

- production activation;
- production promotion;
- NSE authorization;
- Dhan commercial entitlement itself; or
- unrestricted credential custody.

It also does not itself populate or certify the principal, runtime custodian, `companyId`, mapping,
target environment, Stage-3 artifact, evidence owner, or OIDC qualification result. It authorizes
Ramki to perform the bounded designation/request/approval acts listed in §3; each resulting fact
still requires its own evidence.

## 5. Required subordinate records

The following records remain required before D115 identity resolution can leave the fail-closed
state:

1. authoritative Existing-IIPS organizational/service-principal record;
2. named runtime identity custodian and service-principal ownership record;
3. exact D115 `companyId` and approved Company-Security mapping with version, effective period,
   source, approval, and audit reference;
4. named target qualification environment and tenant/region boundary;
5. D115 Stage-3 identity artifact definition and evidence owner;
6. sanitized, environment-specific OIDC evidence and qualification result; and
7. Dhan Level-1 provider/entitlement evidence, without treating this act as granting commercial
   entitlement.

NSE remains deferred. No Dhan entitlement, credential, token, or provider connection is created by
this act.

## 6. Current disposition after this act

The D115 **authority holder and bounded authority scope are now explicitly established** by this
act. The subordinate identity, custody, mapping, environment, evidence, OIDC, and provider facts
remain unassigned or unqualified until separately recorded.

```text
D115 AUTHORITY = PARTIALLY ESTABLISHED
D115 IDENTITY RESOLUTION = BLOCKED
```

A committed copy of this act is an authority record only. It is not D115 qualification, identity
binding, or production authorization.

## 7. Read-only boundaries

This act makes no application-code, source, test, fixture, identity, Keycloak, credential, secret,
token, provider, entitlement, production, or accepted-gate change. It does not reopen or modify any
accepted or certified product gate.
