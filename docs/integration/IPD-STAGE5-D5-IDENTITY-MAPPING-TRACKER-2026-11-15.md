# IPD Stage 5 D5 — identity mapping and resolution tracker

**Tracker status:** active blocker. **Product ownership decision: APPROVED. Technical identity mapping: PENDING. Schema design: PROPOSAL PREPARED / AWAITING APPROVAL. Operational provisioning: NOT AUTHORIZED. D5: BLOCKED. D6: NOT STARTED.**

This IPD-owned tracker records the current Stage 5 prerequisite without changing historical Gate 4/Gate 5 evidence or the general portfolio roadmap. It is governed by the [IPD personal local operating model](../IPD-OPERATING-MODEL.md). It does not authorize operational access, provisioning, migration, reassignment, database changes, or IPC operations.

## Current determination

The Program Authority direction approves `owner-4dc756b3` as the overall owner of personal investment portfolios across broker and manual sources. Source and provenance remain independently represented; S1/Direct P1 functionality must not be silently replaced or invalidated.

The approved S1 tuple and adopted D02 holdings owner/tenant requirement are documented in the [IPD D02 ownership determination](IPD-D02-OVERALL-PERSONAL-PORTFOLIO-OWNERSHIP-DETERMINATION-2026-11-15.md). The mapping and schema alternatives are investigated in the [IPD D02 personal portfolio ownership architecture proposal](IPD-D02-PERSONAL-PORTFOLIO-OWNERSHIP-ARCHITECTURE-PROPOSAL-2026-11-15.md). That proposal recommends an explicit owner relationship while preserving S1, but is not a Program Authority technical decision. No D02 principal label, binding ID, or membership ID has been approved by these records.

## Blocker and resolution criteria

| Item | Status | Evidence / exit criterion |
|---|---|---|
| Product-level overall personal portfolio owner | **APPROVED** — D02 owner `owner-4dc756b3`, tenant `ipd-personal-local`, all supported broker sources and manual entries | Current Program Authority direction recorded in the linked determination. Source/provenance remains independently identifiable. |
| S1 / Direct P1 identity | **ESTABLISHED for its existing purpose** — `ramki-personal-local` / `ipd-personal-local` / `ipd-owner-ramki-personal`, binding `c5808abaffd072d6401ce63ad86c6ac0`, membership `d25dcc5370100b00766efc5166f65cf3` | Effective S1 determination; do not silently change. |
| S1 → D02 principal/owner mapping | **PENDING AUTHORITY DETERMINATION** | Program Authority determination states the mapping, whether the S1 membership remains P1-only or is related to D02, and how existing Direct P1 behavior/data are preserved. |
| D02 principal label / binding ID / membership ID | **NOT APPROVED** | Must be specified by or traceable to the approved identity determination. Do not calculate or infer missing authority from implementation formulas or database contents. |
| Representation / schema | **PROPOSAL PREPARED / AWAITING APPROVAL** | The linked architecture proposal recommends an additive explicit owner-link table and portfolio-source metadata while preserving migration 003 and S1 records. Program Authority must approve or amend mapping semantics, relation, uniqueness/FK rules and source granularity before implementation; no migration in this task. |
| Operational provisioning / database modification | **NOT AUTHORIZED** | This design task grants no database access, row creation, identity provisioning, owner reassignment or migration execution. Separate applicable authority and procedure are required. |
| Read-only D5 verifier | **NOT IMPLEMENTED** | Only after identity mapping and schema contract approval. It must use the holdings-specific acceptance predicate, independently verify exact approved fields, preserve read-only database integrity, and test wrong owner/tenant, missing/multiple binding or membership, and generic-success/holdings-failure cases. |
| D5 completion | **BLOCKED** | Approved mapping + approved representation + implemented/read-only verifier tests + prescribed host evidence. No pass based on process PIDs, readiness, flags, or synthetic fixtures. |
| D6 | **NOT STARTED** | Remains out of scope until D5 passes and separate D6 prerequisites are met. |

## Technical design proposal — prepared, not approved

The [architecture proposal](IPD-D02-PERSONAL-PORTFOLIO-OWNERSHIP-ARCHITECTURE-PROPOSAL-2026-11-15.md) recommends preserving the existing S1 binding/membership and adding an explicit principal-membership-to-D02-owner relationship plus portfolio-source metadata. This requires a separately approved D02 resolver and authorization predicate; current exact membership-owner equality must continue to fail closed until then. Alternatives, consequences, proposed model, historical-data safeguards and exact Program Authority decisions are detailed there.

This is a **design proposal only**. No mapping is selected and no schema, implementation, migration or operational action is approved by the proposal. Program Authority approval is required for relationship semantics, mapping subject/multiplicity, D02 resolver contract, additive schema and historical-record treatment. The approved product criterion does not decide the technical representation by itself.

The proposal evaluates (without selecting) an explicit owner link while preserving the S1 membership; a separately represented D02 membership/context if PA requires the membership itself to carry D02 owner; replacement/rebinding of S1 (not recommended and incompatible absent superseding authority); and deferral (retain current fail-closed behavior). The linked design explains compatibility and historical-data consequences for each. The approved product criterion does not decide the technical mapping by itself.

## Next actions and authority

1. **Program Authority (Ramki, as named in the effective S1 identity determination):** render the identity/mapping determination listed above. The current approved product direction is not that missing technical determination.
2. **IPD engineering:** after the authority determination, document the proposed representation and compatibility effects; do not modify operational records.
3. **IPD engineering:** only after mapping and schema design approval, implement and test a read-only D5 verifier against disposable synthetic databases. Do not install dependencies for this tracker task.
4. **Authorized host operation:** only under a later applicable authority/procedure, perform D5 verification. No D6 or live portfolio read under this tracker.

## Evidence checked

- Current IPD technical design proposal (proposal only; awaiting PA decision): [`IPD-D02-PERSONAL-PORTFOLIO-OWNERSHIP-ARCHITECTURE-PROPOSAL-2026-11-15.md`](IPD-D02-PERSONAL-PORTFOLIO-OWNERSHIP-ARCHITECTURE-PROPOSAL-2026-11-15.md).
- Effective S1 identity-value determination: [`IIPS_V3_CAP02_S1_IDENTITY_VALUE_DETERMINATION_EFFECTIVE_2026-10-24.md`](../../evidence/cross-repository/IIPS_V3_CAP02_S1_IDENTITY_VALUE_DETERMINATION_EFFECTIVE_2026-10-24.md).
- IPD mirror of the adopted D02/D03/D05 authority and reconstruction: [`IIPS_V3_D02_D03_D05_RECONSTRUCTION_IPD_IMPLEMENTATION_EVIDENCE_2026-11-06.md`](../../evidence/cross-repository/IIPS_V3_D02_D03_D05_RECONSTRUCTION_IPD_IMPLEMENTATION_EVIDENCE_2026-11-06.md); authority blob `cea7fed5618ed08683cf9d12d22b0a6e02c557f4` independently matched against IRR main content (read-only).
- Binding predicate and D02 owner requirement: [`src/persistence/binding.ts`](../../src/persistence/binding.ts).
- Single-active schema constraint: [`migration 003`](../../src/persistence/migrations/003_local_principal_bindings.ts).
- Legacy S1-only Direct P1 verification: [`src/persistence/directP1Provisioning.ts`](../../src/persistence/directP1Provisioning.ts), DP-V5–DP-V8; DP-V8 calls the generic resolver.
- Existing D02 fixture tests are synthetic and explicitly not operational provisioning: [`tests/durable_holdings_contract_v1.test.ts`](../../tests/durable_holdings_contract_v1.test.ts) and [`tests/durable_holdings_recovery_v1.test.ts`](../../tests/durable_holdings_recovery_v1.test.ts).

**No source code, identity record, database, migration, environment, or runtime was modified.**
