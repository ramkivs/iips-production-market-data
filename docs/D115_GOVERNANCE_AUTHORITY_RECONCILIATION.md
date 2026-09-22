# D115 — GOVERNANCE / AUTHORITY RECONCILIATION

**Assessment type:** Strictly read-only authority reconciliation
**Assessment date:** 2026-09-22
**Repository baseline inspected:** `da4305149bd5495789f893f530edb2526d08bb5b`
**Branch:** `arena/01a0c86d-iips-production-market-data`
**Actors assessed:** Ramki, Sai, Raj, and Raji
**Existing identity disposition preserved:** `D115 IDENTITY RESOLUTION = BLOCKED`

> This is an evidence assessment and documentation record only. It is not a D115 qualification,
> identity binding, production authorization, credential or Keycloak provisioning act, provider
> entitlement, Company/Security approval, or implementation authorization. No accepted gate is
> reopened or changed.

---

## 1. Executive determination

The governed repository contains explicit **bounded IIPS phase/gate roles** for Ramki, Sai, and
Raji. It does not contain an explicit D115 authority act for any of the four assessed actors. Raj
has no explicit authority role in the inspected governed evidence.

The evidence distinguishes:

- **Program Authority** acts that are explicit but document- and activity-bounded;
- **A3** gate-acceptor designations that are gate-specific;
- **A2** certification designations that are certification-specific and separate from A3;
- **A4** production-activation control that is P16-specific; and
- the generic **A1 security/identity authority clearance**, which is not person-named.

None of those records assigns a named person to D115 governance authority, D115 identity approval,
Existing-IIPS principal ownership, runtime identity custody, D115 Stage-3 identity artifact
ownership, D115 evidence ownership, Company/Security mapping approval, environment/runtime
qualification, or Dhan Level-1 provider/entitlement authority.

```text
D115 AUTHORITY = NOT ESTABLISHED
D115 IDENTITY RESOLUTION = BLOCKED
```

A new explicit D115 authority act is required. This report does not guess whether that act must be
performed by Sai, Ramki, both, or another authority.

---

## 2. Evidence discipline

Only existing governed repository evidence was used. The following rules were applied:

1. A name in authorship, a commit, a code contribution, a test, or a historical citation is not an
   authority assignment.
2. A gate-specific A3 designation is not broader Program Authority, D115 identity authority,
   certification, production authorization, provider execution authority, or another gate's role.
3. A2, A3, and A4 remain distinct even when the same person holds more than one explicitly
   designated role.
4. A generic technical component, repository owner label, `existing-IIPS` boundary, or code
   class is not a human or organizational custodian.
5. Absence of D115-specific evidence is not filled by inference from general IIPS involvement.
6. The user-specified route is retained: Dhan is the active Level-1 route for this assessment and
   NSE remains deferred. The repository has no Dhan authority record; historical NSE records are
   preserved and not rewritten.

The prior read-only identity assessment at `docs/D115_IDENTITY_RESOLUTION_AND_BINDING_RECONCILIATION.md`
remains a separate assessment artifact. It is not used as authority evidence for this matrix.

---

## 3. Authority evidence matrix

| Actor | Explicit Role Found | Evidence | Scope | D115 Identity Authority? | Runtime Custodian? | Company/Security Approval? | Evidence Owner? | Missing Authority |
|---|---|---|---|---|---|---|---|---|
| **Ramki** | **Program Authority** is explicitly named jointly as **Sai / Ramki** in bounded acts; Ramki is also explicitly named as a phase/gate authority in earlier records. | `docs/D13_PHASE_07_ENTRY_AUTHORIZATION.md:21-22,44-60,138-154` names Ramki for P07 entry/preflight/design sequencing and expressly excludes implementation, A3/A2, certification, production, provider/licensed execution, and Existing-IIPS work. `docs/D26_P11_ENTRY_AUTHORIZATION_ADJUDICATION.md:11,262-279`, `docs/D29_P12_IMPLEMENTATION_AUTHORIZATION.md:10-13,179`, `docs/D32_P13_IMPLEMENTATION_AUTHORIZATION.md:10-13`, and `docs/P16_ENTRY_AUTHORIZATION.md:75,232-244` name Program Authority as Sai / Ramki for their respective acts. `docs/E13-10_EB14-3_CLOSURE.md:184-196` records Program Authority (Sai / Ramki) for that closure act. | Act-specific P07 entry/preflight/design, P11 entry, P12/P13 implementation authorization, P16 entry/implementation/closure, and E13-10/EB14-3 closure. The records do not create a standing D115 identity mandate. | **NO.** No D115-specific designation or authority packet exists. The bounded Program Authority acts cannot be extended to D115 identity by inference. | **NO.** No runtime custodian or service-principal owner is named. A technical enforcement seam is not a custodian designation. | **NO.** P04 requires an explicit mapping approval/authority reference, while the A1 security/identity role is not person-named. Ramki/Sai methodology authority for specified taxonomy/namespace matters is not Company/Security mapping approval. | **NO.** No D115 evidence-owner assignment is made to Ramki. An existing-IIPS program owner in a bounded dependency record is not a personal D115 evidence-owner designation. | D115 governance and identity approval; Existing-IIPS principal/service-principal ownership; runtime custody; D115 Stage-3 artifact and evidence ownership; Company/Security approval; environment/runtime qualification; Dhan provider/entitlement authority; any D115 A1/A2/A3/A4 assignment. |
| **Ramki** | **Gate-specific A3** and bounded certification roles are explicit in existing records: P01 Act 2, P05, P06, P10, and the D5/C8 certification authority record. | `docs/PHASE_07_ACT2_REACCEPTANCE.md:4,19` names Ramki as A3 for the P01 Act 2 amendment. `docs/p06/P06_GATE_ACCEPTANCE.md:20-28` names Ramki as A3 for P06 only and explicitly states P07–P17 are not designated. `docs/PHASE_10_GATE_ACCEPTANCE.md:7,86-142` names Ramki as P10 A3 only. `docs/PHASE_07_ACT5_VALUE_ADOPTION.md:57-59` and `docs/PHASE_07_THRESHOLD_CONTRACT_RESOLUTION.md:194` record Ramki for D5/C8 certification authority. | P01 Act 2 amendment acceptance; P06 gate acceptance; P10 gate acceptance; D5/C8 certification. Each scope is separate and does not become D115 identity authority. | **NO.** A3/certification evidence is not a D115 identity act. | **NO.** No custody role is assigned. | **NO.** D5/C8 certification and phase acceptance do not approve the D115 Company/Security mapping. | **NO.** No D115 evidence ownership is assigned. | Same D115-specific gaps listed above; specifically no permission to issue or assemble a D115 authority packet. |
| **Sai** | **Program Authority** is explicitly named jointly as **Sai / Ramki** in bounded acts. Sai also has explicit P07 entry/acceptance and later phase authority records. | `docs/D26_P11_ENTRY_AUTHORIZATION_ADJUDICATION.md:11,262-279`, `docs/D29_P12_IMPLEMENTATION_AUTHORIZATION.md:10-13,179`, `docs/D32_P13_IMPLEMENTATION_AUTHORIZATION.md:10-13`, `docs/P16_ENTRY_AUTHORIZATION.md:75,232-244`, and `docs/P16_CLOSURE.md:4,13,187` identify the joint Program Authority act. | The scope is the particular P11/P12/P13/P16 or closure decision. `docs/PHASE_07_O3_ACT_A_DESIGNATION.md:11-21,23-39` assigns the **Program Authority** (not a named individual) the P07-03 provider-selection A-role. | **NO.** No D115-specific act names Sai. The provider-selection A-role is abstractly assigned to Program Authority for P07-03 and does not establish Dhan entitlement authority or D115 identity authority. | **NO.** No runtime custodian or service-principal owner is named. | **NO.** `docs/PHASE_07_O6_AUTHORITY_RECONCILIATION.md:20-65` expressly separates A2 from A1 security/identity authority. Sai's methodology/Program Authority records do not supply a D115 mapping approval. | **NO.** No D115 evidence-owner act names Sai. | D115 governance and identity approval; Existing-IIPS principal/service-principal ownership; runtime custody; D115 Stage-3 artifact and evidence ownership; Company/Security approval; environment/runtime qualification; Dhan provider/entitlement authority; any D115 A1/A2/A3/A4 assignment. |
| **Sai** | **A2 certification authority** for C1–C12, scoped to P07 certification; separate **A3** designations for P07, P08, P09, P12, P13, and P14. | `docs/PHASE_07_O6_AUTHORITY_RECONCILIATION.md:20-27,31-54` names Sai A2 for C1–C12, scoped to P07 certification, and `:56-65` preserves A2 ≠ A3 and A2 ≠ A1. `docs/PHASE_07_A3_P07_DESIGNATION.md:33-57,73-101` names Sai as P07 A3 only. `docs/PHASE_08_GATE_ACCEPTANCE.md:4,11`, `docs/PHASE_09_ACCEPTANCE.md:4,16`, `docs/D31_P12_A3_ACCEPTOR_DESIGNATION.md:17-48`, `docs/D33_P13_A3_ACCEPTOR_DESIGNATION.md:17-46`, and `docs/D37_P14_A3_DESIGNATION.md:18-43` preserve separate gate-specific designations. | P07 A2 certification; P07/P08/P09/P12/P13/P14 gate acceptance only. These roles are not D115 identity approval, runtime custody, mapping approval, or provider entitlement. | **NO.** Existing A2/A3 designations are not D115 designations. | **NO.** A2 certification does not designate runtime custody. | **NO.** C1–C12 certification and phase acceptance do not constitute D115 Company/Security mapping approval. | **NO.** No D115 evidence ownership is assigned. | D115-specific authority packet and every D115 owner listed above remain absent. |
| **Raj** | **No explicit authority role found** under the exact actor name `Raj`. | The exact-name inspection found no governed authority assignment for `Raj`. References to `Raji` were kept separate and were not normalized to `Raj`. No role is inferred from repository searches, authorship, or general involvement. | None established. | **NO.** | **NO.** | **NO.** | **NO.** | All D115 authority roles: governance, identity approval, Existing-IIPS principal ownership, runtime custody, Stage-3 artifact ownership, evidence ownership, Company/Security approval, environment/runtime qualification, Dhan provider/entitlement authority, and any A-role. |
| **Raji** | Explicit **A3** for P11; later P15 records explicitly describe Raji as P15 A3; explicit **P16 A4**, **P16 A3**, and **P16 A2** roles. | `docs/D27_P11_A3_ACCEPTOR_DESIGNATION.md:9-40,61-71,99-128` names Raji as P11 A3 only. `docs/P15_SCOPE_DEFINITION.md:151-195,261` and `docs/P15_CLOSURE_REPORT.md:12,74,96,439-445,499,547-559` record Raji's P15 gate role/acceptance. `docs/P16_A4_DESIGNATION.md:14-46,100-115,165-187,205-209` names Raji P16 A4 only. `docs/P16_CLOSURE.md:23-33,129-135,151-157` records Raji as P16 A4, A3, and A2, all P16-only. | P11 gate acceptance; P15 gate acceptance in the later P15 scope/closure records; P16 production-activation control, P16 gate acceptance, and P16 certification. A2, A3, and A4 remain separate. | **NO.** No D115 identity authority or identity-approval act exists. | **NO.** P16 A4 is production activation control, not runtime identity custody or environment qualification. | **NO.** P16 A2 certification and P16 A4 activation do not approve a D115 Company/Security mapping. | **NO.** No D115 evidence-owner assignment is made. | D115 governance and identity approval; Existing-IIPS principal/service-principal ownership; runtime custody; D115 Stage-3 artifact and evidence ownership; Company/Security approval; environment/runtime qualification; Dhan provider/entitlement authority; any D115-specific role. |

### P15 record reconciliation

The repository contains an internal P15-era scope conflict that is not resolved by this assessment:

- `docs/P15_A3_DESIGNATION.md:11-17,33-53,78-82` says P15 A3 was **not designated** and rejects automatic extension from prior roles.
- `docs/P15_SCOPE_DEFINITION.md:151-195,261` and `docs/P15_CLOSURE_REPORT.md:12,74,439-445,547-559` later describe Raji as the P15 A3 acceptor and record acceptance.

This assessment does not reopen or rewrite P15. The later explicit P15 acceptance records are reported as existing bounded evidence, while the conflict is preserved. Neither version supplies D115 authority, runtime custody, Company/Security approval, or evidence ownership.

---

## 4. Requested determinations

### A — Explicitly assigned D115 authority roles

**None.** No record explicitly assigns any of Ramki, Sai, Raj, or Raji to any of the following D115 roles:

1. D115 governance authority;
2. D115 identity approval;
3. Existing-IIPS organizational/service-principal ownership;
4. runtime identity custody;
5. D115 Stage-3 identity artifact ownership;
6. D115 evidence ownership;
7. Company/Security mapping approval;
8. environment/runtime qualification;
9. Dhan Level-1 provider or entitlement authority; or
10. a D115-specific A1, A2, A3, or A4 designation.

Existing A3/A2/A4 records are real assignments, but they are limited to the phase, gate,
certification, or activation scopes stated in those records. Generic A1 security/identity clearance
is not person-named and is not a D115 act.

### B — Unassigned roles

All ten D115 authority roles listed in A are unassigned in the existing evidence. In addition:

- the D115 principal/service-principal record is absent;
- the runtime custodian and service-principal owner are absent;
- the D115 Stage-3 artifact definition and evidence owner are absent;
- the exact Company/Security mapping approval and audit reference are absent;
- the selected D115 environment and its qualification owner are absent; and
- Dhan provider/entitlement evidence is absent from the repository.

`docs/PHASE_07_O3_ACT_A_DESIGNATION.md:11-21` is an explicit Program Authority A-role for a
P07-03 provider-selection decision, but it names no person, does not select Dhan, does not grant
provider entitlement, and does not establish D115 authority.

### C — Can Ramki issue or assemble any part of the D115 authority packet?

**Not on the existing evidence.** Ramki may act only within the exact scopes of the explicit
Program Authority, P07, P01, P05, P06, P10, or D5/C8 records listed above. Those records do not
authorize him to issue, approve, or assemble a D115 identity authority packet, nor do they make him
the D115 evidence owner or runtime custodian.

Ramki could participate only after a new explicit D115 authority act assigns a defined scope. This
report does not create that assignment. Repository inspection, authorship, commits, prior gates,
or general IIPS involvement cannot supply it.

### D — Do Sai, Raj, or Raji have documented D115-relevant authority?

- **Sai:** documented IIPS Program Authority, A2 certification, and several gate-specific A3 roles;
  **no documented D115-relevant identity authority**.
- **Raj:** no explicit governed authority role found; **no documented D115-relevant authority**.
- **Raji:** documented P11/P15/P16 gate, certification, and P16 activation roles;
  **no documented D115-relevant identity authority**.

No one in this group has a documented D115 runtime-custody, Company/Security mapping-approval,
D115 Stage-3 ownership, or Dhan entitlement role.

### E — Is a new explicit authority act required?

**Yes.** The next authority act must explicitly establish, at minimum:

1. the D115 governance/identity authority and its exact scope;
2. the authoritative Existing-IIPS organizational or service principal;
3. the accountable runtime identity custodian and service-principal owner;
4. the D115 Stage-3 identity artifact owner and evidence owner;
5. the Company/Security mapping approver and auditable mapping reference;
6. the target environment and qualification authority; and
7. the Dhan Level-1 provider/entitlement authority and route boundary, with NSE left deferred.

Separate implementation, qualification, acceptance, and production acts remain required where the
governed model requires them. This assessment does not make any of those acts.

### F — Exactly who must act next based only on existing evidence

The exact next actor class established by existing evidence is the **Program Authority**, which
must issue a new explicit D115-specific authority act. Existing records use **Program Authority
(Sai / Ramki)** for particular bounded acts, but they do **not** establish whether Sai alone,
Ramki alone, or both must act for D115. Therefore no individual may be named here without guessing.

The new act must also name the separate authorities or accountable owners for the Existing-IIPS
principal, runtime/IdP qualification, Company/Security mapping, D115 Stage-3/evidence ownership,
and Dhan entitlement. The repository supplies no person-name for those owners. Until those acts
and records exist, the correct action is to preserve the D115 fail-closed state and perform no
identity binding or provider enablement.

---

## 5. Route and state preservation

- Dhan remains the active Level-1 route for this assessment because that is the supplied
  operational constraint, not because the repository contains Dhan evidence.
- No Dhan reference, provider entitlement, credential, or qualification record exists in the
  repository.
- Historical/current-looking NSE selection artifacts remain unchanged and deferred; this report
  does not rewrite or reopen them.
- `D115 IDENTITY RESOLUTION = BLOCKED` remains unchanged.
- A committed report is not D115 qualification, identity binding, or production authorization.

---

## 6. Read-only and non-authority statement

This reconciliation made no application-code, source, test, fixture, identity, Keycloak, credential,
secret, token, provider, entitlement, production, or accepted-gate changes. It creates no principal,
role, identity binding, Company/Security mapping, environment qualification, or Dhan access.

```text
D115 AUTHORITY = NOT ESTABLISHED
D115 IDENTITY RESOLUTION = BLOCKED
```

---

## 7. Subsequent explicit authority act

After the baseline reconciliation above, an explicit D115 authority act was supplied and the
holder was selected as **Ramki**. The durable act is recorded at
`docs/D115_AUTHORITY_ACT.md` (`D115-AUTHORITY-001`). This is a new authority act, not an inference
from the earlier phase records.

The act establishes Ramki as the bounded D115 identity-authority holder with authority to designate
or approve the items listed in that act. It does **not** itself populate the organizational/service
principal, runtime custodian, `companyId`/Company-Security mapping, environment, Stage-3 evidence
owner, OIDC qualification result, or Dhan entitlement. Those subordinate records remain required.

Accordingly, the current post-act disposition is:

```text
D115 AUTHORITY = PARTIALLY ESTABLISHED
D115 IDENTITY RESOLUTION = BLOCKED
```

The baseline findings in Sections 3–4 remain accurate for the state before this subsequent act;
they are not retroactively rewritten. No production, credential, Keycloak, provider, or accepted-gate
state changed.
