# IPD Program Authority determination — D02 overall personal portfolio ownership

**Record status:** **PROGRAM AUTHORITY DIRECTION — APPROVED** for product ownership policy. **Technical identity mapping — PENDING.** This record does not approve or establish a D02 principal, binding, membership, schema, provisioning action, D5 completion, or D6 operation.

**Date:** 2026-11-15
**Repository owner:** IPD (`ramkivs/iips-production-market-data`)
**Authority source:** explicit Program Authority direction supplied for this task, headed “Program Authority Direction: D02 Overall Personal Portfolio Ownership”. This record memorializes that direction; it does not invent a signature, external identity attestation, or approval of unresolved technical details.

## 1. Approved product ownership decision

The D02 canonical owner `owner-4dc756b3` is the overall owner of the user's personal investment portfolios in IIPS, regardless of portfolio or holding source. This includes Dhan, Zerodha, other supported broker imports, and manually created Personal Portfolio holdings.

The product must provide one personal-user experience for these portfolios while keeping broker-imported and manually managed portfolios independently identifiable and manageable. Portfolio source and provenance remain distinct and preserved. Ownership is not determined by source. The user does not need separate logins or personal accounts for different sources.

The direction does **not** silently replace, invalidate, migrate, reassign, or modify existing S1 identity or Direct P1 functionality.

## 2. Existing approved identity contexts — preserved without conflation

### S1 / Direct P1

The effective S1 identity-value determination establishes this tuple for its recorded Direct P1 purpose:

| Field | Established value |
|---|---|
| `principal_label` | `ramki-personal-local` |
| `tenant_id` | `ipd-personal-local` |
| `canonical_owner_id` | `ipd-owner-ramki-personal` |
| `binding_id` | `c5808abaffd072d6401ce63ad86c6ac0` |
| `membership_id` | `d25dcc5370100b00766efc5166f65cf3` |

Authority: [`IIPS_V3_CAP02_S1_IDENTITY_VALUE_DETERMINATION_EFFECTIVE_2026-10-24.md`](../../evidence/cross-repository/IIPS_V3_CAP02_S1_IDENTITY_VALUE_DETERMINATION_EFFECTIVE_2026-10-24.md). That record names Ramki acting as Program Authority for the identity-value determination and states that changes to those values require a new determination. S1 remains authoritative for its established Direct P1 purpose.

### D02 / holdings owner requirement

The adopted D02 act establishes the canonical holdings owner `owner-4dc756b3` on the retained IPD technical tenant `ipd-personal-local`. It requires a single active binding and membership, resolves the binding afresh, and fails closed on absent, multiple, revoked, malformed, or foreign bindings. It prohibits automatic reassignment and operational provisioning or migration. D05 authorizes bounded engineering and synthetic fixture testing, not operational database access or provisioning.

IPD's reconstructed D02/D03/D05 evidence identifies the effective authority artifact and records its blob as `cea7fed5618ed08683cf9d12d22b0a6e02c557f4`; the current remote act content was independently hashed to that blob during this task. The implementation boundary is in [`src/persistence/binding.ts`](../../src/persistence/binding.ts): the generic resolver returns the sole active binding/membership, while `resolveActiveHoldingsBinding` additionally enforces the D02 owner and tenant.

These records establish the two requirements above. They do **not** establish that the S1 membership is the D02 holdings membership or define a mapping between them.

## 3. Unresolved technical identity contract

The following remain **NOT DETERMINED / NOT APPROVED** for D02:

- Whether the D02 relationship uses the existing S1 `principal_label` or another principal label.
- The D02 `binding_id` and `membership_id` as authorized identity values.
- Whether the S1 membership remains valid for Direct P1 only, also represents D02 holdings, or is related through a separately represented mapping.
- Whether a separate identity context, mapping relation, store, or schema extension is required.
- How the approved relationship preserves existing S1/Direct P1 behavior and pre-existing portfolio data.

No D02 binding or membership value is derived in this record. Deterministic implementation formulas are not a substitute for the missing authority and contract decision.

## 4. Schema constraint

Migration [`003_local_principal_bindings`](../../src/persistence/migrations/003_local_principal_bindings.ts) defines `local_principal_bindings` and `local_principal_memberships`. Partial-unique indexes permit at most one `ACTIVE` binding and at most one `ACTIVE` membership; membership has a foreign key to its binding. There is no context/role column. Consequently, the present schema cannot represent two simultaneous active memberships, one for the S1 owner and another for D02, as separate contexts.

This is a design constraint, not permission to alter the schema, replace an owner, or reassign existing records. D02/D05's bounded authority excludes operational provisioning/migration; no operational database work is authorized by this determination.

## 5. Alternatives for technical design — neutral, none selected

The following alternatives describe consequences for evaluation only. They are not identity decisions, implementation authorization, or a recommendation to mutate existing records.

| Alternative | Potential consequence | Unresolved issue / required authority |
|---|---|---|
| Preserve the S1 active membership unchanged and represent D02 ownership separately | Preserves the recorded S1 tuple and avoids silent replacement. The current schema has no separate ownership-context relation, so D02 would not be operationally resolvable until an approved representation exists. | Determine whether a context-specific mapping or separate store is acceptable; assess schema/design authority and compatibility. |
| Bind the same local principal to the D02 owner in the existing active membership | Could make the holdings-specific resolver's owner/tenant predicate satisfiable, but the generic resolver and Direct P1 verifier would observe a different owner than the S1 tuple. It would affect the existing shared binding context and cannot be done as an implicit reassignment. | Explicitly determine principal and membership identity, the S1 compatibility model, and treatment of existing data; separate operational authority would still be required before any change. |
| Add a distinct D02 ownership context or relationship | Could preserve S1 while explicitly mapping the local principal to the overall portfolio owner. It would require a representation not present in migration 003; a separate store/context would also need a defined lifecycle and consumer contract. | Approve the technical design and any required schema change before implementation; no migration is authorized here. |

The product requirement rules out treating broker/manual source as a different owner, and the preservation requirement rules out silently replacing or invalidating S1. Those constraints do not, by themselves, select a storage or identity mapping.

## 6. Authority and exact decision required

The S1 record identifies **Ramki acting as Program Authority** as the authority holder for the existing identity-value decision. The adopted D02/D03/D05 act also records the PA's express adoption of the D02 owner/tenant rule and expressly withholds operational provisioning/reassignment authority. No source located in IPD or in the adopted D02 act supplies the missing D02 principal, binding/membership values, or the S1-to-D02 relationship.

**Decision required from the Program Authority:** approve an IPD identity-value and mapping determination that states:

1. Whether and how the S1 principal is mapped to D02's overall personal portfolio owner.
2. The authoritative D02 principal label, if one is required, and the D02 binding and membership identity values (or the approved rule/source by which they are established).
3. Whether the S1 membership is retained for Direct P1 only, shared, or represented separately, while preserving the existing S1 functionality and data.
4. Whether the current single-active schema can represent the approved relation or a distinct schema/context design must first be approved.
5. Any limits on future operational provisioning or data treatment; this record itself authorizes none.

Until that determination and the corresponding technical design are approved, **technical identity mapping remains PENDING; D5 remains BLOCKED; D6 remains NOT STARTED**. No D5 verifier may encode a guessed mapping.

## 7. Non-actions and status

No identity, principal, owner, binding, membership, database, schema, credential, environment, or runtime state was changed. No verifier was implemented. No D5 or D6 operation, IPC call, or live holdings read was performed.

This is an approved **product-ownership direction** and a record of the outstanding technical decision. It is **not** an approved D02 active-binding identity contract and is not D5 acceptance.
