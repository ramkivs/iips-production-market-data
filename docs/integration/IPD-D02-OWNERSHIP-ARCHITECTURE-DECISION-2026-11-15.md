# IPD Program Authority decision record — D02 ownership architecture direction

**Record status: PROGRAM AUTHORITY DIRECTION — APPROVED** for the architecture stated below. **Detailed schema — NOT APPROVED. Implementation authority — NOT GRANTED. Operational provisioning — NOT AUTHORIZED.**

**Record ID:** `IPD-D02-OWNERSHIP-ARCHITECTURE-DIRECTION-2026-11-15`
**Decision date:** 2026-11-15
**Authority:** Ramki, acting as Program Authority, in the direction supplied for this IPD task.
**Owner:** IPD (`ramkivs/iips-production-market-data`).
**Related published product decision:** [D02 Overall Personal Portfolio Ownership Determination](IPD-D02-OVERALL-PERSONAL-PORTFOLIO-OWNERSHIP-DETERMINATION-2026-11-15.md).

## 1. Approved architectural direction

The Program Authority approves this direction:

> Preserve the existing S1 identity, binding and membership. Establish a separate, explicit ownership relationship connecting the existing personal identity to D02 overall portfolio owner `owner-4dc756b3`.

`owner-4dc756b3` represents all personal investment portfolios, irrespective of whether holdings originate from Dhan, Zerodha, another supported broker, or manual entry. The identity-to-owner relationship is a separate ownership concept; it does not replace the S1 principal or alter the S1 membership's owner value.

For reference, the established S1 tuple remains:

| S1 field | Existing effective value | Disposition under this decision |
|---|---|---|
| `principal_label` | `ramki-personal-local` | Preserve unchanged |
| `tenant_id` | `ipd-personal-local` | Preserve unchanged |
| S1 `canonical_owner_id` | `ipd-owner-ramki-personal` | Preserve unchanged; do not substitute D02 owner |
| `binding_id` | `c5808abaffd072d6401ce63ad86c6ac0` | Preserve unchanged |
| `membership_id` | `d25dcc5370100b00766efc5166f65cf3` | Preserve unchanged; the detailed design proposes, but this decision does not approve, its FK role |
| D02 overall portfolio owner | `owner-4dc756b3` | Approved portfolio-owner value, distinct from S1 owner |

The S1 values are sourced from the [effective S1 identity-value determination](../../evidence/cross-repository/IIPS_V3_CAP02_S1_IDENTITY_VALUE_DETERMINATION_EFFECTIVE_2026-10-24.md). This decision does not create an active relationship row or assign a relationship identifier.

## 2. Product requirements confirmed

- One personal IIPS user experience owns all of the user's personal portfolios through D02 overall owner `owner-4dc756b3`.
- Dhan, Zerodha, other supported broker imports and manually entered holdings all belong to that overall owner.
- Each portfolio remains independently identifiable and manageable; source and provenance remain distinct and retained.
- No separate login or personal account is required for each broker or portfolio.
- Existing S1 identity and Direct P1 functionality are preserved and must not be silently invalidated.

## 3. Approval boundary

This is an approval of **architectural direction only**. It approves preserving S1 and using a distinct explicit ownership relationship to connect that existing personal identity to D02 overall owner `owner-4dc756b3`. It does **not** approve the detailed schema or any implementation choice, including:

- which exact S1 row is the relationship FK subject, table/column names, relationship identifier format or a concrete relationship ID;
- foreign-key targets, unique indexes, active/revoked lifecycle or multiplicity beyond the high-level separate relationship direction;
- exact D02 resolver implementation, SQL predicates, authorization-context changes or IPC wiring;
- portfolio-source table design or historical row treatment;
- migration code/execution, relationship row creation, data backfill/re-key, provisioning, reassignment or operational database access;
- D5 verifier implementation/acceptance or D6/live holdings work.

The [detailed technical design proposal](IPD-D02-OWNERSHIP-RELATIONSHIP-TECHNICAL-DESIGN-2026-11-15.md) translates this direction into a proposed schema and resolver contract for review. It is explicitly **AWAITING APPROVAL** and is not implementation authority.

## 4. Current behavior remains fail-closed

Until the detailed schema and implementation are separately approved and implemented under applicable authority, the existing D02 holdings resolver continues to require the current exact owner/tenant predicate. It must not be bypassed or treated as if an ownership relationship already exists. The S1 membership continues to represent its established S1 owner for Direct P1. No automatic relationship creation or owner fallback is permitted.

## 5. Required status

- **Product ownership:** APPROVED.
- **Architectural direction:** APPROVED.
- **Detailed schema:** AWAITING APPROVAL.
- **Implementation authority:** NOT GRANTED.
- **Operational provisioning:** NOT AUTHORIZED.
- **D5:** BLOCKED.
- **D6:** NOT STARTED.

## 6. No operational effect

This record does not alter any identity, binding, membership, owner, portfolio, database, migration, environment, runtime, or IRR artifact. No relationship row is created. No verifier is implemented. No D5 or D6 operation is performed.
