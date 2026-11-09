# Stage 4C — Security Identity Governance and Integration Boundary Record

**Repository:** `ramkivs/iips-production-market-data` (IPD)
**IRR repository:** `ramkivs/iips-review-recovered` (read-only, unchanged)
**Branch:** `arena/046844dc-iips-production-market-data`
**Document date:** 2026-11-09
**Class:** documentation-only; no source, schema, migration, write-gate, dependency, IRR, or production changes
**Final classification:** STAGE 4 — NON-PRODUCTION IDENTITY PERSISTENCE CAPABILITY IMPLEMENTED AND TESTED; NORMAL APPLICATION WRITE INTEGRATION BLOCKED BY EXISTING GOVERNANCE.

---

## 1. Repository and Baseline Verification

| Item | Value |
|---|---|
| IPD repository URL | `https://github.com/ramkivs/iips-production-market-data.git` |
| Remote origin | `https://github.com/ramkivs/iips-production-market-data.git` (fetch + push) |
| Full `origin/main` SHA | `de8756de1d7d4082e8e144dadf3fb53373b711c6` (unchanged) |
| Investigation branch | `arena/046844dc-iips-production-market-data` |
| Branch head SHA | `f4ab4292d7eec2513d031c4745ef4c51ec0fb0a8` |
| Working tree | clean |
| PR #144 | OPEN, mergeable, head `f4ab4292d7eec2513d031c4745ef4c51ec0fb0a8`, base `main` |
| IRR repository | `/home/user/iips-review-recovered` at main `820e7efc`, working tree clean, unchanged |

**Assessment documents verified:**

| Document | Path | Status |
|---|---|---|
| Stage 3A | `docs/integration/IRR_STAGE_3A_HOLDING_IDENTITY_AUTHORITATIVE_SOURCE_ASSESSMENT.md` | present |
| Stage 3C | `docs/integration/IRR_STAGE_3C_D05_VS_P7_SECURITY_IDENTITY_AUTHORITY_RECONCILIATION.md` | present |
| Stage 3D | `docs/integration/STAGE-3D-SECURITY-IDENTITY-IMPLEMENTATION-READINESS-AND-GOVERNANCE-DECISION-2026-11-08.md` | present |
| Stage 4 | `docs/integration/STAGE-4-IPD-NON-PRODUCTION-SECURITY-IDENTITY-INGESTION-IMPLEMENTATION.md` | present |
| Stage 4C | this document | new |

**IRR unchanged:** confirmed — IRR working tree clean, remote HEAD unchanged, no modifications to IRR source, schemas, migrations, or PRs #515/#516/#143.

---

## 2. Stage 4 Implementation Outcome

Stage 4 implements the governed, non-production security identity ingestion and qualification path per Stage 3D Outcome B (CONDITIONALLY READY). The implementation is a **tested non-production persistence capability**, not an operationally integrated application workflow.

### 2.1 Implemented capabilities

| Capability | File reference | Status |
|---|---|---|
| P04 exact company correspondence (ISIN → companyId) | `src/providers/dhan/dhan_security_identity_service.ts` | implemented |
| P04 ACTIVE same-exchange listing validation | `src/providers/dhan/dhan_security_identity_service.ts` | implemented |
| P7 vendor-master series evidence | `src/providers/dhan/dhan_security_identity_service.ts` | implemented |
| Joint P04 → P7 qualification | `src/providers/dhan/dhan_security_identity_service.ts` | implemented |
| D114 canonical identity construction (`ISIN:<isin>:<series>`) | `src/providers/dhan/dhan_security_identity_service.ts`, `src/contracts/types.ts` | implemented |
| Preservation of `isinAuthority = NON_AUTHORITATIVE` | `src/contracts/types.ts` | preserved (unchanged) |
| Migration 005 nullable `security_identity` persistence | `src/persistence/migrations/005_holding_security_identity.ts`, `src/persistence/portfolio_store.ts` | tested capability |
| Fail-closed unresolved identity behaviour | `src/providers/dhan/dhan_security_identity_service.ts` | implemented |
| Protection against silent identity replacement | `src/persistence/portfolio_store.ts` (`assertNoSilentIdentityReplacement`) | tested |
| Idempotent persistence (content-hash dedup) | `src/persistence/portfolio_store.ts` | tested |
| Preservation of portfolio quantities, cost basis, valuation snapshots | `src/persistence/portfolio_store.ts` | tested |

### 2.2 Verification evidence

| Evidence | Result |
|---|---|
| Identity qualification tests | 27/27 pass (`tests/irr_stage4_security_identity.test.ts`) |
| Ingestion integration tests | 7/7 pass (`tests/irr_stage4_ingestion_integration.test.ts`) |
| Combined Stage 4 tests | 35/35 pass (27 + 8; see CORRECTION-2026-11-09 below) |
| TypeScript typecheck | `tsc --noEmit` exit 0 |
| Package-consumer test | PASS (bundle purity: `forbiddenHits: []`) |
| Full test suite | 1,403 passed, 0 failed, 1 skipped (pre-existing unrelated) |
| PR #144 CI `typecheck · build · test` | pass |

> **CORRECTION-2026-11-09 (append-only correction; prior text retained verbatim above).**
> This document recorded "7/7 pass (`tests/irr_stage4_ingestion_integration.test.ts`)" and "Combined
> Stage 4 tests **36/36**" while also recording "27/27 (`tests/irr_stage4_security_identity.test.ts`)".
> Measured on `main` at `709fd13c77e90df05900859d23ba57d1004197a0`, the ingestion suite executes **8**
> subtests, so the combined Stage 4 total is **27 + 8 = 35**, not 36. The "36/36" figure is withdrawn;
> the qualification in the following paragraph is unaffected. Evidence:
> `docs/integration/BROKER-IMPORT-IDENTITY-RECONCILIATION-AND-W1-ADMISSION-ASSESSMENT-2026-11-09.md` §1.4.

**Limitation on claims:** The above evidence demonstrates the tested persistence capability through direct-store fixtures. It does **not** demonstrate normal application integration through the authorized consumer path, which remains blocked (see §4 and §5).

---

## 3. Qualification and Persistence Capabilities

### 3.1 Qualification flow (qualified path only)

```
qualifyHoldingSecurityIdentity(input, securityMaster, registry)
  1. ISIN present and syntactically valid (12-char D114 grammar)
  2. P04 exact ISIN correspondence → companyId (resolveCompanyId)
  3. P04 entity ISIN agrees with input ISIN (no conflict)
  4. P04 ACTIVE same-exchange listing exists
  5. P7 registry has unambiguous mapping for (companyId, segment, ISIN)
  6. P7 mapping carries canonical D114 securityId (series evidence)
  7. P7 mapping ISIN agrees with input ISIN (no conflict)
  8. Source evidence usable (lastVerifiedAt present on DHAN_INSTRUMENT_MASTER rows)
  9. Construct D114 canonical identity; isinAuthority = NON_AUTHORITATIVE
```

Any failure returns `UNRESOLVED` with a typed reason:
`MISSING_ISIN`, `INVALID_ISIN_SYNTAX`, `MISSING_P04_CORRESPONDENCE`,
`CONFLICTING_ISIN`, `INACTIVE_OR_MISSING_LISTING`, `MISSING_P7_MAPPING`,
`AMBIGUOUS_PROVIDER_MAPPING`, `MISSING_SERIES_EVIDENCE`,
`CONFLICTING_SERIES`, `EXCHANGE_MISMATCH`, `STALE_SOURCE_EVIDENCE`.

### 3.2 Persistence behavior

- Qualified identity → `security_identity` column populated with D114 identity
- Unresolved identity → `security_identity` remains `NULL` (never inferred, backfilled, or reconstructed)
- Existing identity → NULL rejected (silent replacement refused)
- Existing identity → different series rejected (silent replacement refused)
- NULL → identity permitted (enrichment without data alteration)
- Quantities, average buy price, current price, market value unchanged by identity assignment
- Idempotent re-import with matching content digest → no new revision

---

## 4. Normal Application Composition-Root Limitation

### 4.1 Exact composition-root finding

**File:** `src/ipc/entrypoint.ts`
**Line:** 126
**Invocation:**

```ts
const brokerImportConsumer = createBrokerImportConsumer(db);
```

**Dependencies supplied:** `db` only. Neither `securityMaster` nor `registry` is passed.

**`createBrokerImportConsumer` signature** (`src/ipc/brokerImportConsumer.ts`):

```ts
export function createBrokerImportConsumer(
  db: DatabaseSync,
  options: MapBrokerImportHoldingsOptions = {},
): BrokerImportConsumer
```

`MapBrokerImportHoldingsOptions` has two optional fields:
- `securityMaster?: SecurityMaster`
- `registry?: DhanInstrumentRegistry`

### 4.2 Consequence: normal consumer does not invoke joint qualification

Because both options are `undefined` at the composition root, `mapBrokerImportHoldings` (`src/persistence/brokerImportPersistence.ts`) takes the `else` branch:

```ts
if (h.isin && h.exchange && securityMaster && registry) {
  // P04→P7 joint qualification path — NOT TAKEN through normal workflow
} else {
  securityIdentity = buildD114SecurityIdentity(h.isin, h.series) ?? null;
  // Pre-Stage-4 fallback: direct ISIN+series construction, no P04/P7 qualification
}
```

The fallback:
- Does not check P04 exact company correspondence
- Does not validate P04 ACTIVE same-exchange listing
- Does not consult P7 vendor-master series evidence
- Does not call `qualifyHoldingSecurityIdentity`
- Builds a D114 identity directly from broker-supplied ISIN + series (never inferred)

This is **pre-Stage-4 behavior**, preserved unchanged. The Stage 4 qualification service is **not invoked** through the normal application composition root.

### 4.3 Only test code supplies options

`tests/irr_stage4_ingestion_integration.test.ts` calls
`createBrokerImportConsumer(db, options)` with `{ securityMaster: sm, registry: reg }`.
This is test-only and does not exist in shipped code.

### 4.4 What is not claimed

- Direct-store integration tests are **not** proof of normal application integration.
- The standalone Stage 4 service is **not** operationally integrated.
- Normal broker-import persistence is **not** operational through the authorized path.

---

## 5. Existing Write-Gate Restriction

### 5.1 Exact write-gate behaviour

**File:** `src/persistence/portfolio_store.ts`
**Function:** `evaluatePortSaveGuard()` (line 297)

```ts
export function evaluatePortSaveGuard(): { authorized: boolean; reasons: string[] } {
  return {
    authorized: false,
    reasons: [
      'W-1(3): Gate 4 qualification not accepted',
      'W-1(4): Gate 5 admission not accepted',
    ],
  };
}
```

**Code comment** (line 293-296):
> Gate E W-1(3) (Gate 4 qualification) and W-1(4) (Gate 5 admission) are both false in this build, so the guard can never authorize. No environment flag, test result or operator assertion changes this.

### 5.2 Port enforcement

**File:** `src/persistence/durablePortfolioStorePort.ts`
Every mutating method (`create`, `save`, `reset`, `delete`, `withBrokerImportTransaction`) calls `assertWritable()`:

```ts
private assertWritable(): void {
  const guard = evaluatePortSaveGuard();
  if (!guard.authorized) {
    throw new WriteNotAuthorizedError(guard.reasons.join('; '));
  }
}
```

Result: `WRITE_NOT_AUTHORIZED` with `storeEffect: 'NONE'` — zero rows touched, no transaction begun.

### 5.3 Verified by existing consumer wiring tests

`tests/q1_broker_import_consumer_wiring.test.ts` proves:
- Every import attempt refused with `WRITE_NOT_AUTHORIZED`
- `storeEffect: 'NONE'` on every attempt
- Zero row changes across portfolios/revisions/holdings/contributions
- Database snapshot byte-identical before and after
- No transaction started (`store.isTransaction === false`)
- Refusal cannot be overridden by any environment flag

### 5.4 Nature of restriction

- **Predates Stage 4** — not introduced by PR #144.
- **Intentional governance control** — not a bug to fix.
- **Explicitly prohibited from alteration:** weakening, bypassing, environment-variable authorization, test-only production bypasses.
- **Not modified by Stage 4** — `evaluatePortSaveGuard()` unchanged.

---

## 6. Responsibility and Decision-Owner Matrix

| Item | Owner | Current status |
|---|---|---|
| Security identity qualification | IPD | Implemented capability |
| P04/P7 dependency composition at application root | IPD | Not connected at application composition root |
| Migration 005 persistence | IPD | Tested capability |
| Normal broker-import write authorization | Program Authority | Blocked by W-1(3)/W-1(4) |
| Gate 4 qualification acceptance | Program Authority | Outstanding |
| Gate 5 admission | Program Authority | Outstanding |
| ISIN provenance (G-01) | Program Authority | Open |
| P7 series authority (G-02) | Program Authority | Open |
| P7 freshness (G-03) | Program Authority | Open |
| P04/D05 freshness (G-04) | Program Authority | Open |
| Identity correction/audit (G-05) | Program Authority / IPD | Open |
| Production authorization (G-06) | Program Authority | Not granted |
| IRR holding input contract | IRR | Unchanged |

**Distinction:** Engineering ownership (IPD) covers implementation capability. Decision authority (Program Authority) covers gate acceptance, freshness thresholds, and production authorization. Engineering cannot activate normal writes without Program Authority decisions.

---

## 7. G-01 Through G-06 Status

| Decision ID | Question | Owner | Status |
|---|---|---|---|
| G-01 | Is `NON_AUTHORITATIVE` acceptable as permanent ISIN designation? | Program Authority | Open |
| G-02 | Is P7 Dhan SERIES acceptable as production series source? | Program Authority | Open |
| G-03 | Freshness threshold for stale P7 vendor master? | Program Authority | Open |
| G-04 | Freshness threshold for stale P04/D05 listing? | Program Authority | Open |
| G-05 | Identity correction and audit trail requirements? | Program Authority / IPD | Open |
| G-06 | Production authorization for Dhan security identity ingestion? | Program Authority | Not granted |

G-01 through G-05 must be resolved before G-06 can be considered. None are resolved in this build.

---

## 8. PR #144 Disposition

| Item | Disposition |
|---|---|
| PR #144 state | OPEN |
| PR #144 merged? | No — UNMERGED |
| PR #144 head SHA | `f4ab4292d7eec2513d031c4745ef4c51ec0fb0a8` |
| Stage 4 implementation accepted as | Tested non-production persistence capability |
| Normal application integration | Blocked — not operational |
| Merge implication | Merging PR #144 does **not** imply normal broker-import workflow is operational |
| Future merge requirement | Must preserve this limitation explicitly |
| PRs #141, #142, #143 | Unchanged, not modified |

---

## 9. Permitted Next Steps

**Permitted without weakening governance:**
- Documentation and evidence maintenance
- Read-only investigation of Gate 4 and Gate 5 acceptance requirements
- Read-only assessment of the future application composition contract
- Preparation of implementation plans conditional on explicit gate acceptance

**Not permitted until authority decisions are recorded:**
- Activating normal broker-import writes
- Changing `evaluatePortSaveGuard()`
- Treating the Stage 4 service as operationally integrated
- Production deployment or live Dhan qualification

**No new implementation task is started in this stage.**

---

## 10. Explicit Non-Production and Non-Live Limitations

- No live Dhan requests from IRR or IPD application code
- No credential provisioning or handling
- No quote retrieval or valuation implementation
- No production activity or deployment
- No production authorization granted
- `isinAuthority` remains `NON_AUTHORITATIVE` — no upgrade
- No unrestricted identity correction
- IRR unchanged — no IRR source, schema, migration, or dependency changes
- No changes to PRs #141, #142, or #143
- Remote main unchanged at `de8756de1d7d4082e8e144dadf3fb53373b711c6`

---

## 11. Completion Report

| Item | Value |
|---|---|
| Full repository URL | `https://github.com/ramkivs/iips-production-market-data.git` |
| Full remote main SHA | `de8756de1d7d4082e8e144dadf3fb53373b711c6` |
| Investigation branch commit SHA | `f4ab4292d7eec2513d031c4745ef4c51ec0fb0a8` |
| Document path | `docs/integration/STAGE-4C-SECURITY-IDENTITY-GOVERNANCE-AND-INTEGRATION-BOUNDARY-2026-11-09.md` |
| PR #144 status | OPEN, head `f4ab4292d7eec2513d031c4745ef4c51ec0fb0a8` |
| Write-gate behaviour | Unchanged — `authorized: false`, W-1(3)/W-1(4) unmet |
| IRR status | Unchanged at `820e7efc` |
| Implementation or live operation | None — documentation and tested persistence capability only |
| Outstanding governance decisions | G-01 through G-06 (Program Authority) |

**Final classification:** STAGE 4 — NON-PRODUCTION IDENTITY PERSISTENCE CAPABILITY IMPLEMENTED AND TESTED; NORMAL APPLICATION WRITE INTEGRATION BLOCKED BY EXISTING GOVERNANCE.
