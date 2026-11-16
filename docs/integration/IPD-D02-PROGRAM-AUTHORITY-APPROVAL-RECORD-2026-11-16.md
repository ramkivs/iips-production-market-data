# IPD Program Authority approval record — D02 decisions D01–D03

**Decision date:** 2026-11-15
**Authority:** Ramki, acting as Program Authority, as explicitly stated in the direction supplied for this task.
**Owner:** IPD (`ramkivs/iips-production-market-data`)
**Related register:** [D02 Program Authority Decision Package](IPD-D02-PROGRAM-AUTHORITY-DECISION-PACKAGE-2026-11-16.md)

## Recorded approvals

The Program Authority explicitly approved the proposed defaults for **D01, D02 and D03** in the published decision package. This record preserves the supplied plain-English decisions and maps them to the exact alternatives and recommendations in those register entries. It records no decision beyond those three defaults.

| ID | Exact approved plain-English direction | Formal package mapping | Status |
|---|---|---|---|
| **D01 — Relationship subject** | “Connect the existing S1 membership to D02 overall portfolio owner `owner-4dc756b3` through a separate explicit ownership relationship.” | Selects D01 alternative **(a)** and its proposed default: the established S1 membership is the relationship FK subject, with the specified S1 binding, principal, tenant, owner and ACTIVE-state checks on resolution. It rejects a principal/binding-only subject and does not create another D02 context. | **APPROVED — this decision only** |
| **D02 — Identity values** | “Do not create an additional personal user identity or invent a separate D02 identity tuple.” | Selects D02 alternative **(a)** and its proposed default: preserve the existing S1 identity and represent D02 ownership through the separate relationship; no new D02 principal, binding or membership value is assigned or derived. The relationship record ID remains a different concept and is not an identity tuple. | **APPROVED — this decision only** |
| **D03 — Tenant-scoped references** | “Enforce tenant-scoped ownership relationships and matching membership/tenant references.” | Selects D03 alternative **(a)** and its proposed default: tenant-scoped composite membership and owner-registry FKs, matching membership/owner tenant values, required parent unique keys, and restrictive deletion. Resolver status checks remain necessary because FKs do not prove ACTIVE state. | **APPROVED — this decision only** |

## Correspondence and scope check

The three supplied plain-English statements select the same alternatives as the proposed defaults in the published register; no contradiction or alternative-selection discrepancy was found. This mapping records the Program Authority's approval of those proposed defaults as written. It does not silently add a different identity, owner, tenant, membership, relationship target or source policy.

The detailed implementation expressions named inside the recommendations—such as the resolver's field checks and FK/index shape—are recorded here only as the meaning of the approved D01/D03 defaults. Their inclusion does **not** constitute validation of DDL, approval of the entire detailed schema, a migration instruction, or implementation authority. The exact D01–D03 defaults should remain visible in the register, while the remaining decisions stay pending.

## Decisions not approved by this record

- **D04–D22: PENDING.** No approval is inferred from D01–D03.
- **Detailed schema approval: PENDING.** These three approved decisions do not approve the entire Level C design or close its other choices and evidence gates.
- **Implementation authority: NOT GRANTED.** No code, schema implementation, migration or verifier work is authorized.
- **Operational provisioning or migration: NOT AUTHORIZED.** No database access, identity/relationship/owner/source row creation, re-key, reassignment or operational action is authorized.
- **D5: BLOCKED. D6: NOT STARTED.** Neither status changes through this record.

No relationship ID or row has been created. The existing S1 tuple and Direct P1 behavior remain unchanged. This is an IPD-owned record of the explicit authority decision only; it is not a provisioning record or execution evidence.
