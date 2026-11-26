# IPD Stage 5 D5 — identity mapping and resolution tracker

**Tracker status:** active blocker. **Product ownership: APPROVED. Architectural direction: APPROVED. Identity-to-owner relationship direction: APPROVED (not provisioned). Design review: ACCEPTED WITH CONDITIONS. Detailed schema approval: PENDING. Implementation authority: NOT GRANTED. Operational provisioning: NOT AUTHORIZED. D5: BLOCKED. D6: NOT STARTED.**

This IPD-owned tracker records the current Stage 5 prerequisite without changing historical Gate 4/Gate 5 evidence or the general portfolio roadmap. It is governed by the [IPD personal local operating model](../IPD-OPERATING-MODEL.md). It does not authorize operational access, provisioning, migration, reassignment, database changes, or IPC operations.

## Current determination

The Program Authority direction approves `owner-4dc756b3` as the overall owner of personal investment portfolios across broker and manual sources. Source and provenance remain independently represented; S1/Direct P1 functionality must not be silently replaced or invalidated.

The [Program Authority architecture decision](IPD-D02-OWNERSHIP-ARCHITECTURE-DECISION-2026-11-15.md) approves preserving the existing S1 identity/binding/membership and connecting that personal identity to D02 owner `owner-4dc756b3` through a separate explicit ownership relationship. The prior [architecture investigation](IPD-D02-PERSONAL-PORTFOLIO-OWNERSHIP-ARCHITECTURE-PROPOSAL-2026-11-15.md) remains the evidence-backed rationale. The revised [relationship/schema design](IPD-D02-OWNERSHIP-RELATIONSHIP-TECHNICAL-DESIGN-2026-11-15.md) addresses the review findings with candidate schema, source links, authorization boundary, transaction rules and historical-data plan; condition traceability is in §13.10 and proposed PA decisions are in §13.11. The [Program Authority decision package](IPD-D02-PROGRAM-AUTHORITY-DECISION-PACKAGE-2026-11-16.md) contains 22 decision items: D01–D03 are APPROVED by the [PA approval record](IPD-D02-PROGRAM-AUTHORITY-APPROVAL-RECORD-2026-11-16.md); D04–D22 remain PENDING. Remaining proposed defaults are NOT APPROVED until PA explicitly accepts them. The independent review outcome remains **ACCEPTED WITH CONDITIONS** as a design baseline only. No relationship row or identifier is created; no separate D02 principal, binding or membership is proposed.

## Blocker and resolution criteria

| Item | Status | Evidence / exit criterion |
|---|---|---|
| Product-level overall personal portfolio owner | **APPROVED** — D02 owner `owner-4dc756b3`, tenant `ipd-personal-local`, all supported broker sources and manual entries | Current Program Authority direction recorded in the linked determination. Source/provenance remains independently identifiable. |
| S1 / Direct P1 identity | **ESTABLISHED for its existing purpose** — `ramki-personal-local` / `ipd-personal-local` / `ipd-owner-ramki-personal`, binding `c5808abaffd072d6401ce63ad86c6ac0`, membership `d25dcc5370100b00766efc5166f65cf3` | Effective S1 determination; do not silently change. |
| S1 identity → D02 overall owner relationship direction | **APPROVED ARCHITECTURE / NOT PROVISIONED** | Preserve S1 tuple; establish a separate relationship to `owner-4dc756b3`. No row/relationship ID created. Detailed schema and implementation remain pending. |
| Separate D02 principal / binding / membership | **NOT PART OF APPROVED DIRECTION** | Preserve existing S1 identity; do not create duplicate identity identifiers. Proposed relationship ID is not assigned and must not be derived. |
| Independent design review | **ACCEPTED WITH CONDITIONS** | Acceptance report maps the prior conditions to revised design §13.10. This is technical review only and not schema or implementation authority. |
| Detailed schema | **PENDING** | Revised §13 defines candidate constraints, FKs, uniqueness, source catalog/cardinality/link tables, transaction-bound authorization, inventory, re-key/rollback and tests. D01–D03 are separately approved; the remaining detailed schema and evidence gates are not. No migration in this task. |
| D01 — Relationship subject | **APPROVED** | Use the existing S1 membership as subject for a separate explicit relationship to `owner-4dc756b3`, with the checks in the approved D01 default. No relationship is provisioned. |
| D02 — Identity tuple | **APPROVED** | Do not create an additional personal identity or invent a separate D02 identity tuple. This is not a provisioning authorization. |
| D03 — Tenant-scoped references | **APPROVED** | Enforce tenant-scoped ownership relationships and matching membership/tenant references as defined in the approved D03 default. No schema change is implemented. |
| Local single-user applicability review | **REVIEW / RECOMMENDATIONS ONLY** | The [scope review](IPD-D02-LOCAL-SINGLE-USER-SCOPE-APPLICABILITY-REVIEW-2026-11-15.md) finds essential local correctness/data-integrity requirements, recommends simplifying or deferring several registry/account/re-key/approval-workflow details, and flags historical-row and D02/D05 authority evidence gaps. It changes no D01–D22 formal statuses or authority. |
| Outstanding Program Authority decisions | **PENDING — 19 decisions (D04–D22)** | Decision package records alternatives, recommendations still marked NOT APPROVED, dependencies and separate approval statements. D01–D03 approvals do not grant implementation or operational authority. |
| Historical database row inventory | **NOT PERFORMED / UNKNOWN** | Repository schema inventory is documented in §13.7. No operational database was accessed; actual counts, rows and collisions are unknown. PA must select historical-row treatment and separately authorize any read-only inventory/data migration procedure before rollout. |
| Implementation authority | **NOT GRANTED** | Architectural direction does not authorize code, schema, resolver, authorization or verifier implementation. |
| Operational provisioning / database modification | **NOT AUTHORIZED** | This design task grants no database access, row creation, identity provisioning, owner reassignment or migration execution. Separate applicable authority and procedure are required. |
| Read-only D5 verifier | **NOT IMPLEMENTED** | Only after detailed schema approval and implementation authority. It must use the holdings-specific acceptance predicate, independently verify exact approved fields, preserve read-only database integrity, and test wrong owner/tenant, missing/multiple binding or membership, and generic-success/holdings-failure cases. |
| D5 completion | **BLOCKED** | Approved mapping + approved representation + implemented/read-only verifier tests + prescribed host evidence. No pass based on process PIDs, readiness, flags, or synthetic fixtures. |
| D6 | **NOT STARTED** | Remains out of scope until D5 passes and separate D6 prerequisites are met. |

## Approved direction and pending detailed design

The [Program Authority decision record](IPD-D02-OWNERSHIP-ARCHITECTURE-DECISION-2026-11-15.md) now approves preservation of S1 and a separate explicit relationship to D02 owner `owner-4dc756b3`. The earlier [architecture proposal](IPD-D02-PERSONAL-PORTFOLIO-OWNERSHIP-ARCHITECTURE-PROPOSAL-2026-11-15.md) supplies the verified current-state analysis. The [detailed technical design](IPD-D02-OWNERSHIP-RELATIONSHIP-TECHNICAL-DESIGN-2026-11-15.md) specifies candidate schema, resolver, lifecycle, history, tests and acceptance criteria; it remains **AWAITING APPROVAL**.

No relationship ID/row is created. No implementation authority is granted. Current exact membership-owner resolver behavior must keep failing closed until a separately approved and implemented D02 relationship resolver exists. No D5 verifier work or D6 operation proceeds under this decision.

## Next actions and authority

1. **Program Authority:** D01–D03 are recorded APPROVED; disposition remaining items D04–D22 in the [decision package](IPD-D02-PROGRAM-AUTHORITY-DECISION-PACKAGE-2026-11-16.md). Their defaults remain NOT APPROVED until explicitly accepted. Design approval alone does not grant implementation or provisioning.
2. **IPD engineering:** perform no implementation until separate implementation authority is granted; retain current fail-closed D02 behavior.
3. **IPD engineering:** D5 verifier implementation/testing only after detailed schema approval and implementation authority.
4. **Authorized host operation:** D5 verification only under later applicable authority/procedure; D6/live holdings remains unstarted.

## Evidence checked

- Program Authority decision package (22 items; D01–D03 approved, D04–D22 pending): [`IPD-D02-PROGRAM-AUTHORITY-DECISION-PACKAGE-2026-11-16.md`](IPD-D02-PROGRAM-AUTHORITY-DECISION-PACKAGE-2026-11-16.md).
- Recorded Program Authority approval for D01–D03 only: [`IPD-D02-PROGRAM-AUTHORITY-APPROVAL-RECORD-2026-11-16.md`](IPD-D02-PROGRAM-AUTHORITY-APPROVAL-RECORD-2026-11-16.md).
- Local single-user scope/applicability review (recommendations only; no status change): [`IPD-D02-LOCAL-SINGLE-USER-SCOPE-APPLICABILITY-REVIEW-2026-11-15.md`](IPD-D02-LOCAL-SINGLE-USER-SCOPE-APPLICABILITY-REVIEW-2026-11-15.md).
- Independent technical review and conditions: [`IPD-D02-OWNERSHIP-RELATIONSHIP-DESIGN-ACCEPTANCE-REVIEW-2026-11-15.md`](IPD-D02-OWNERSHIP-RELATIONSHIP-DESIGN-ACCEPTANCE-REVIEW-2026-11-15.md).
- Approved architectural direction: [`IPD-D02-OWNERSHIP-ARCHITECTURE-DECISION-2026-11-15.md`](IPD-D02-OWNERSHIP-ARCHITECTURE-DECISION-2026-11-15.md).
- Detailed schema/resolver proposal (awaiting approval): [`IPD-D02-OWNERSHIP-RELATIONSHIP-TECHNICAL-DESIGN-2026-11-15.md`](IPD-D02-OWNERSHIP-RELATIONSHIP-TECHNICAL-DESIGN-2026-11-15.md).
- Prior IPD architecture investigation (the architecture direction is now approved; detailed schema remains pending): [`IPD-D02-PERSONAL-PORTFOLIO-OWNERSHIP-ARCHITECTURE-PROPOSAL-2026-11-15.md`](IPD-D02-PERSONAL-PORTFOLIO-OWNERSHIP-ARCHITECTURE-PROPOSAL-2026-11-15.md).
- Effective S1 identity-value determination: [`IIPS_V3_CAP02_S1_IDENTITY_VALUE_DETERMINATION_EFFECTIVE_2026-10-24.md`](../../evidence/cross-repository/IIPS_V3_CAP02_S1_IDENTITY_VALUE_DETERMINATION_EFFECTIVE_2026-10-24.md).
- IPD mirror of the adopted D02/D03/D05 authority and reconstruction: [`IIPS_V3_D02_D03_D05_RECONSTRUCTION_IPD_IMPLEMENTATION_EVIDENCE_2026-11-06.md`](../../evidence/cross-repository/IIPS_V3_D02_D03_D05_RECONSTRUCTION_IPD_IMPLEMENTATION_EVIDENCE_2026-11-06.md); authority blob `cea7fed5618ed08683cf9d12d22b0a6e02c557f4` independently matched against IRR main content (read-only).
- Binding predicate and D02 owner requirement: [`src/persistence/binding.ts`](../../src/persistence/binding.ts).
- Single-active schema constraint: [`migration 003`](../../src/persistence/migrations/003_local_principal_bindings.ts).
- Legacy S1-only Direct P1 verification: [`src/persistence/directP1Provisioning.ts`](../../src/persistence/directP1Provisioning.ts), DP-V5–DP-V8; DP-V8 calls the generic resolver.
- Existing D02 fixture tests are synthetic and explicitly not operational provisioning: [`tests/durable_holdings_contract_v1.test.ts`](../../tests/durable_holdings_contract_v1.test.ts) and [`tests/durable_holdings_recovery_v1.test.ts`](../../tests/durable_holdings_recovery_v1.test.ts).

**No source code, identity record, database, migration, environment, or runtime was modified.**
