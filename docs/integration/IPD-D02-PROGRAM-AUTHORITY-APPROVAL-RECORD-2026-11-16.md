# IPD Program Authority approval record — D02 decisions D01–D03 and narrow D5/D16 read-only evidence inventory

**Decision dates:** 2026-11-15 (Level C decisions D01–D03); 2026-11-16 (Level C decisions D04–D20; RD-2026-11-16 resolver deviation ratification; narrow Level E read-only D5/D16 evidence inventory)
**Authority:** Ramki, acting as Program Authority, as explicitly stated in the directions supplied for these tasks.
**Owner:** IPD (`ramkivs/iips-production-market-data`)
**Related register:** [D02 Program Authority Decision Package](IPD-D02-PROGRAM-AUTHORITY-DECISION-PACKAGE-2026-11-16.md)
**Related inventory and blocker record:** [D5/D16 Read-Only Evidence Inventory and Host Blocker Report (2026-11-16)](IPD-D02-D5-D16-READ-ONLY-INVENTORY-AND-BLOCKER-REPORT-2026-11-16.md)

## Recorded approvals

### 1. Level C discrete design decisions approved on 2026-11-15 (D01–D03)

On 2026-11-15, the Program Authority explicitly approved the proposed defaults for **D01, D02 and D03** in the published decision package. This section preserves the supplied plain-English decisions and maps them to the exact alternatives and recommendations in those register entries. It records no Level C decision beyond those three defaults.

| ID | Exact approved plain-English direction | Formal package mapping | Status |
|---|---|---|---|
| **D01 — Relationship subject** | “Connect the existing S1 membership to D02 overall portfolio owner `owner-4dc756b3` through a separate explicit ownership relationship.” | Selects D01 alternative **(a)** and its proposed default: the established S1 membership is the relationship FK subject, with the specified S1 binding, principal, tenant, owner and ACTIVE-state checks on resolution. It rejects a principal/binding-only subject and does not create another D02 context. | **APPROVED — this decision only** |
| **D02 — Identity values** | “Do not create an additional personal user identity or invent a separate D02 identity tuple.” | Selects D02 alternative **(a)** and its proposed default: preserve the existing S1 identity and represent D02 ownership through the separate relationship; no new D02 principal, binding or membership value is assigned or derived. The relationship record ID remains a different concept and is not an identity tuple. | **APPROVED — this decision only** |
| **D03 — Tenant-scoped references** | “Enforce tenant-scoped ownership relationships and matching membership/tenant references.” | Selects D03 alternative **(a)** and its proposed default: tenant-scoped composite membership and owner-registry FKs, matching membership/owner tenant values, required parent unique keys, and restrictive deletion. Resolver status checks remain necessary because FKs do not prove ACTIVE state. | **APPROVED — this decision only** |

### 3. Level C detailed design decisions approved on 2026-11-16 (D04–D20)

On 2026-11-16, the Program Authority explicitly **APPROVED** the detailed technical schema design for decisions **D04 through D20** in the published decision package. This is **Level C detailed design approval only** — it covers schema, multiplicity, lifecycle, IDs, authority reference, audit events, authorization boundary, resolver contract, transaction boundaries, provider taxonomy, account identity, source cardinality, row links, historical provenance, historical disposition, inventory/collision policy, re-key scope, migration mechanics, rollback/recovery, and local single-user scope.

**This Level C approval does NOT:**
- Grant D21 Level D implementation authority (remains NOT GRANTED)
- Grant D22 Level E operational provisioning/migration authority (remains NOT AUTHORIZED)
- Authorize any database mutation, schema change, migration execution, or relationship row creation
- Constitute D5 acceptance (D5 remains BLOCKED)
- Authorize D6 (remains NOT STARTED)

### 4. Resolver deviation ratification on 2026-11-16 (RD-2026-11-16)

On 2026-11-16, the Program Authority explicitly **RATIFIED** RD-2026-11-16: the existing `resolveD02PortfolioAccess()` and `resolveD02PortfolioAccessInCurrentTransaction()` implementation in `src/persistence/binding.ts` and their associated 12 unit tests in `tests/durable_holdings_d02_d05_unit.test.ts`. Ratification is under the existing engineering authorization (IIPS-V3-PA-D02-D03-D05-ENGINEERING-2026-11-06-01, 5-file envelope including `src/persistence/binding.ts`).

**This ratification does NOT:**
- Grant D21 Level D implementation authority (remains NOT GRANTED)
- Grant D22 Level E operational provisioning/migration authority (remains NOT AUTHORIZED)
- Authorize any relationship row provisioning or data migration
- Constitute D5 acceptance (D5 remains BLOCKED)

## Correspondence and scope check

The three supplied plain-English statements select the same alternatives as the proposed defaults in the published register; no contradiction or alternative-selection discrepancy was found. This mapping records the Program Authority's approval of those proposed defaults as written. It does not silently add a different identity, owner, tenant, membership, relationship target or source policy.

The detailed implementation expressions named inside the recommendations—such as the resolver's field checks and FK/index shape—are recorded here only as the meaning of the approved D01/D03 defaults. Their inclusion does **not** constitute validation of DDL, approval of the entire detailed schema, a migration instruction, or implementation authority. The exact D01–D03 defaults should remain visible in the register, while the remaining decisions stay pending.

### 2. Narrow Level E read-only D5/D16 evidence inventory approved on 2026-11-16

On **2026-11-16**, the Program Authority explicitly approved a **narrowly scoped, strictly non-mutating D5/D16 evidence inventory** of the existing local SQLite database (`C:\iips-data\iips\user-portfolio.sqlite` / `IIPS_G3_DATABASE_PATH`) solely to collect evidence required for:

1. **D5 identity-mapping evidence** (inspection of existing local binding, membership, audit-chain and candidate D02 relationship/registry state); and
2. **D16 historical inventory and collision assessment** (inspection of existing portfolio, revision, holding, contribution, restore-receipt and migration-ledger state, candidate historical portfolios, duplicate identifiers/collisions, NULL relationships, orphan records and provenance fields without inferring ownership from source labels).

| Scope aspect | Recorded Program Authority rule (2026-11-16) | Formal package / tracker mapping | Status |
|---|---|---|---|
| **Authorized read-only activities** | Read-only inspection of the existing local database; inventory of existing portfolio and ownership records; identification of candidate historical portfolios; counts of relevant records and relationships; identification of duplicate identifiers, collisions, NULL relationships and orphan records; inspection of existing `_migration_ledger` state without executing migrations; collection of historical ownership and provenance evidence; documentation of unknown or ambiguous records without assigning inferred ownership. | Narrow Level E read-only inspection authorization satisfying the operational-authority precondition noted in register items **D16** and **D22** for **read-only inventory only**, without approving any Level C policy default in D15–D19 or any broader D22 operational step. | **APPROVED — narrow read-only inventory scope only (2026-11-16)** |
| **Mandatory safe-execution guards** | Identify exact database path and state first; inspect startup/migration code paths to establish a genuinely read-only access method; do **not** use normal application startup (`src/ipc/entrypoint.ts`); confirm the selected method cannot execute migrations or write to the database; STOP if read-only access cannot be established confidently or if the live database is unreachable; preserve original worktree and existing changes; do not infer historical ownership from source labels alone. | Governs execution of the 2026-11-16 inventory attempt recorded in [IPD-D02-D5-D16-READ-ONLY-INVENTORY-AND-BLOCKER-REPORT-2026-11-16.md](IPD-D02-D5-D16-READ-ONLY-INVENTORY-AND-BLOCKER-REPORT-2026-11-16.md) and [`d5-d16-readonly-inventory-status-2026-11-16.json`](../../evidence/d02-inventory-2026-11-16/d5-d16-readonly-inventory-status-2026-11-16.json). | **MANDATORY BOUNDARY** |
| **Absolute prohibitions** | Does **NOT** permit schema changes, migration execution or `_migration_ledger` writes, portfolio or holding writes, identity provisioning or reassignment, historical re-keying or ownership movement, tombstone restoration, reset or replacement operations, application startup if it could invoke the migration runner, dependency installation, database modification, D5 acceptance, D6 execution, IRR repository changes, or PR merging. | Preserves Level C (`APPROVED — D04–D20`), Level D (`NOT GRANTED`), all mutating Level E operations (`NOT AUTHORIZED`), D5 (`BLOCKED`) and D6 (`NOT STARTED`). | **PROHIBITED** |

## Decisions not approved by this record

- **D04–D20: APPROVED** at Level C detailed design (2026-11-16) — recorded in section 3 above. Design approval only; does not grant implementation, provisioning, or migration.
- **RD-2026-11-16: RATIFIED** — recorded in section 4 above. Does NOT grant D21 Level D or D22 Level E authority.
- **D21 Level D implementation authority: GRANTED (2026-11-17)** for the D5 read-only verifier at `src/persistence/d5-readonly-verifier.ts`. Separate explicit Level D statement issued naming specific code/schema/test scope with stated exclusions. Level C design approval does not imply Level D, but D21 was granted independently.
- **D22 Level E operational provisioning/migration: NOT AUTHORIZED.** Requires separate explicit Level E authorization for each named operation.
- **D5: BLOCKED.** D5-T1 (PASS), D5-T2 (PASS — Level C detailed technical schema approval satisfied by D04–D20 Level C approval, 2026-11-16), D5-T3 (PASS — D21 Level D grant 2026-11-17, verifier implemented at `src/persistence/d5-readonly-verifier.ts`, all tests pass), D5-T4 (PASS); D5-T5 PENDING (separate PA acceptance of D5-T1 through T4 required).
- **D6: NOT STARTED.** Remains out of scope until D5 passes and its evidence is separately accepted.

No relationship ID or row has been created, and no database file was created or modified. In the 2026-11-16 Arena Linux sandbox run, the designated Windows host database (`C:\iips-data\iips\user-portfolio.sqlite`) is absent/unreachable (`IIPS_G3_DATABASE_PATH` unset; zero SQLite files present), so live row inspection stopped safely with the exact host-access blocker and read-only SQL inspection specification recorded in [IPD-D02-D5-D16-READ-ONLY-INVENTORY-AND-BLOCKER-REPORT-2026-11-16.md](IPD-D02-D5-D16-READ-ONLY-INVENTORY-AND-BLOCKER-REPORT-2026-11-16.md). The existing S1 tuple and Direct P1 behavior remain unchanged.
