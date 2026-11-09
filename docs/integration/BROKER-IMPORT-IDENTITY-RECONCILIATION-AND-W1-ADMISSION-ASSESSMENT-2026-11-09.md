# Broker Import — Identity-Resolution Reconciliation and W-1 Local Write-Admission Assessment

**Repository:** `ramkivs/iips-production-market-data` (IPD)
**Branch basis:** `main` at `709fd13c77e90df05900859d23ba57d1004197a0`
**Class:** read-only investigation plus IPD-owned documentation corrections and one evidence-integrity test.
No identity-master change, no invented mapping, no relaxed qualification rule, no W-1 change, no
portfolio-persistence change, no Gate 4/Gate 5 work, no IRR write, no production claim.

---

## Part 1 — Identity-resolution reconciliation (Item 4)

### 1.1 The three results are three different measurements, not three answers to one question

All three sit in `evidence/integration/ws-a-dhan-68-row/`. They differ in **input identifier**,
**master revision**, and **resolution method**. Two of them are *the same 68-row surface measured
twice*; the third is *a different input vector measured once*.

| # | Result | File (verifiable) | Input actually supplied | Master | Method | Kind |
|---|---|---|---|---|---|---|
| 1 | **1 resolved / 67 unresolved** | `identity-outcomes.json` → run `GOVERNED_D05_SECURITY_MASTER`; also `identity-outcomes-authenticated-2026-11-08.json` → run `GOVERNED_B_06_WAVE1_MASTER` | `DHAN_WEB_UI_SUMMARY_V1`, 68 rows, **name only** (`suppliedIsin: null`, `suppliedExchange: null` on all 68) | Wave-1 `BATCH-D05-TIER2-BROAD-UNIVERSE-2026-09-22-001` (`7f53540b…`, 2,250 records) | Unchanged pipeline `assessBrokerRowIdentity` → governed broker-observation resolver on `UNSCOPED_NAME_OR_SYMBOL` | **Same surface as #2**, older master |
| 2 | **3 resolved / 65 unresolved** | `identity-outcomes-authenticated-2026-11-08.json` → run `GOVERNED_AUTHENTICATED_MASTER_2026-11-08` | **Same** `DHAN_WEB_UI_SUMMARY_V1` surface, **name only** (`suppliedIsin: null` on all 68) | Authenticated `BATCH-D05-REPLACEMENT-AUTHENTICATED-UNIVERSE-2026-11-08-001` (`b555fd28…`, 2,390 records) | **Same** pipeline and same method as #1 | Same surface as #1, newer master |
| 3 | **65 resolved / 3 unresolved** | `identity-outcomes-reassessment-2026-11-08.json` → run `GOVERNED_AUTHENTICATED_MASTER_2026-11-08` | **ISIN vector**: 68 ISINs joined 1:1 by exact normalized display name from `evidence/operator_drop/wave2-2026-11-06/source.csv` (`2dc1d1fb…`, `ISIN Code` populated on all 68 rows) | Authenticated `BATCH-D05-REPLACEMENT-AUTHENTICATED-UNIVERSE-2026-11-08-001` | **Different method**: `SecurityMaster.resolveCompanyId({ identifierType: 'ISIN' })` exact-ISIN only | **Different input**, PC §9-A one-time PA authorization |

Measured directly from the artifacts (`evaluated` / `resolved` / `unresolved` fields):

```
#1  Wave-1 master,          name surface   → 68 evaluated,  1 resolved, 67 unresolved, refusalCodes {NO_AUTHORITATIVE_IDENTIFIER_MATCH: 67}
#2  Authenticated master,   name surface   → 68 evaluated,  3 resolved, 65 unresolved, refusalCodes {NO_AUTHORITATIVE_IDENTIFIER_MATCH: 65}
#3  Authenticated master,   ISIN vector    → 68 evaluated, 65 resolved,  3 unresolved, refusalCodes {UNMAPPED_IDENTIFIER: 3}
```

### 1.2 Why #2 and #3 must never be conflated

`DHAN_WEB_UI_SUMMARY_V1` has an 8-column header —
`Name, Quantity, Avg Price, Last Traded, Investment, Current Value, P&L, P&L %` — and therefore
carries **no ISIN and no exchange**. Result #3 is **not** a re-run of that surface. It supplies an
identifier the surface does not contain, obtained from a *different* committed artifact (the B-04
companion Dhan holdings export) via a 1:1 name join.

Consequences that must stay attached to #3:

- #3 is reachable **only** because a second, external input was introduced. It is not evidence that
  the summary surface improves, and it cannot be produced from the summary surface alone.
- The join is a documented 68/68 exact case-insensitive, whitespace-normalized display-name match
  with no ambiguity. Quantity agreement is 65/68; the three disagreements (rows 1, 38, 54 — AGI
  GREENPAC, KM SUGAR MILLS, SALASAR TECHNO ENGINEERING) are the already-documented
  de-concatenation class and do not affect identity, which acts on the name/ISIN, not on quantity.
- `identifierClass` is `ISIN` for all 68 rows in #3. No `UNSCOPED_NAME_OR_SYMBOL` trial was relied
  upon for the reassessed rows.
- **In all three results `saveable` is `false` and `persistedRows` is `0`.** #3 resolving 65
  identities authorizes nothing; the import disposition remains `REJECTED`.

### 1.3 The three unresolved cases in #3 retain their existing governance dispositions

The only three `UNRESOLVED` rows in #3, each `refusalCode: UNMAPPED_IDENTIFIER`:

| Row | Display name | ISIN | Governance disposition (unchanged) |
|---|---|---|---|
| 44 | NATIONAL STOCK EXCHANGE OF INDIA | `INE721I01024` | Outside the authorized NSE CM EQ universe — BSE-only ACTIVE group A equity, no NSE CM EQ listing. `§9-C` universe expansion **declined by PA**; fails closed by design. |
| 51 | RADHIKA JEWELTECH | `INE583V01021` | NSE series **BE**, BSE group **T**/SME — outside the cash-equity scope of the authorized universe. No alias, no exception. |
| 63 | UNIVASTU | `INE562X01013` | NSE series **BE**, absent from BSE active-equity — outside scope. No alias, no exception. |

Verified in the artifact: `outOfScope: { rows: [44, 51, 63], disposition: "EXCLUDED_FROM_UNIVERSE by
PA 2026-11-08", behavior: "fail-closed UNMAPPED_IDENTIFIER", aliases: "none", exceptions: "none" }`
and `changeControl: { ruleChanges: "none", aliasesAdded: "none", universeAltered: false,
fuzzyMatching: false, saveable: false }`.

The three previously-resolved identities are also preserved, not re-derived: rows 1, 21, 40 →
`EQ_AGI_IN`, `EQ_GHCL_IN`, `EQ_KROSS_IN`, each marked `identical: true` in
`priorResolutionPreservation`. Appendix A reconciliation is 65/65 expected-value matches with 0
mismatches (62 previously-unresolved in-scope rows + the 3 preserved).

**Nothing in this reconciliation resolves, reclassifies or closes any of the three rows, and no
identity is invented.**

### 1.4 Confirmed IPD-owned documentation discrepancies (corrected in this pass)

| Location | Discrepancy | Correction |
|---|---|---|
| `docs/integration/STAGE-4C-…-2026-11-09.md` §2.2, §4.4, §5.3, §6, §11 | States "7/7 pass (`tests/irr_stage4_ingestion_integration.test.ts`)" and "Combined Stage 4 tests **36/36**" while simultaneously stating "27/27 (`tests/irr_stage4_security_identity.test.ts`)". Measured on `main`: 27 + 8 = **35**, not 36. | Corrected to 27 + 8 = 35. |
| `docs/d05_audit_and_source_readiness_tools.md` §8 item 4 (in an append-only section) | "**B-06 closes subject to PA acknowledgement**"; §8 heading says "B-06 closure (P9) executed". Superseded: the PA review disposition of record states "**B-06: REMAINS OPEN** … must not be marked complete, closed or production-accepted by any artifact derived from this decision." | Append-only correction note added; heading and limit line retained verbatim. |
| `docs/integration/IRR_STAGE_3A_…-ASSESSMENT.md` §4, §"Unresolved dependencies" #3 | Cites `B04-DHAN-68-ISIN-NSE-REASSESSMENT-2026-11-06.md`, which **does not exist** in this repository (`git ls-files` returns nothing). Its replacement is the root-cause investigation + the §9-A reassessment evidence. The row's "ISIN index **UNTESTED**" statement is stale — the index has since been tested at 65/68. | Inline correction added; the superseded text is retained. |

Correctly stated elsewhere and left unchanged: `docs/d05_audit_and_source_readiness_tools.md` §7
item 4 and the WS-A record — both already restate "64 of the 67 Wave-2-disposition ISINs are now
carried natively" and "3/68 resolved" as the name-surface result, which is the correct measurement.

### 1.5 Findings recorded, no code change made

These are accurate in substance but are **authority-bound records** (append-only evidence artifacts
and PA-derived acts), not IPD-owned documentation discrepancies. They are reported, not edited:

1. `evidence/cross-repository/IIPS_V3_D05_B06_68ROW_REASSESSMENT_2026-11-08.md` §4 still says
   "P9 executed; **B-06 closed by this record subject to PA acknowledgement**" in its body. Two
   later appendices in the same file record that closure as withdrawn. The append-only convention
   forbids editing the body; a reader must read to the end of the file.
2. `docs/integration/IRR_STAGE_3A-…-ASSESSMENT.md` §4 calls the historical result "**1 resolved** …
   ISIN index **UNTESTED** for the 67 unresolved rows" and inserts `DHAN_WEB_UI_SUMMARY_V1` into the
   source table as "67/68 unresolved". Both are measurements against the *Wave-1* master (result #1),
   correct at the time, not current.
3. `evidence/integration/ws-a-dhan-68-row/README.md` describes `identity-outcomes.json` only and does
   not enumerate the two later 2026-11-08 artifacts that live beside it. Adding to it would change a
   sha-pinned evidence file; the cross-reference is delivered in this document instead.

### 1.6 Authority note on `docs/LOCAL-PERSONAL-USE-PERSISTENCE.md`

That document's opening states the local personal-use path is authorized by "the Program Authority's
authorization of 2026-11-08", but this repository holds **no rendered PA act** for it, and the
accepted Gate E policy W-1 states "No environment flag, test result or operator assertion changes
this." The record is a genuine implementation record; the *authority rendering* is not present in
IPD. This is a **decision outstanding** (§2.7), not something this pass may resolve.

---

## Part 2 — W-1 local single-user write-admission assessment (Item 6)

### 2.1 The exact W-1 conditions

**Authoritative source:** `evidence/cross-repository/IIPS_V3_G2_GATE_E_PORTFOLIO_WRITE_POLICY_2026-10-18.md`
§2 W-1, accepted (rev 1) by the Program Authority on 2026-10-18 under G2-D2.

> A write operation (`portfolio.create`, `portfolio.save`, `portfolio.reset`, `portfolio.delete`) may
> succeed **only** when all of the following hold … "all four required; none implied by another":
>
> 1. this policy is **accepted** by the Program Authority (Gate 2);
> 2. a **Gate 3** implementation-authority act names the exact repository, IPD-`main` basis, file set
>    and tests for the write path;
> 3. a **Gate 4** qualification run covering §4 has been executed on the deployment host **and**
>    accepted by a separate result-acceptance act;
> 4. a **Gate 5** admission act names the qualified IPD and IRR commits and lifts the IRR `503` fence
>    for the named operations.

| # | Condition | Status on `main` @ `709fd13` | Rationale |
|---|---|---|---|
| 1 | Gate E policy accepted by PA | **MET** | Accepted rev 1, 2026-10-18, G2-D2 |
| 2 | Gate 3 implementation-authority act | **MET** | Gate 3 `ACCEPTED — bounded implementation scope only` |
| 3 | Gate 4 host qualification **and** separate result-acceptance act | **NOT MET** | Gate 4 `AUTHORIZED — NOT STARTED`; `0 of 11` QE executed; no result-acceptance act rendered |
| 4 | Gate 5 admission act naming qualified commits and lifting the IRR `503` fence | **NOT MET** | No Gate 5 act exists; no admission record; IRR `503` fence state unchanged |

**The two unmet conditions are exactly W-1(3) and W-1(4)** — the two literals the shipped guard
emits.

### 2.2 The guard as implemented

`src/persistence/portfolio_store.ts` — `evaluatePortSaveGuard(context?)`:

- **No context** → `{ authorized: false, reasons: ['W-1(3)…', 'W-1(4)…'] }`. Default deny, preserved
  "for every existing caller … regardless of process environment".
- **Context with `IIPS_LOCAL_PERSONAL_USE=1` and a validated `(canonicalOwnerId, tenantId)`** →
  `{ authorized: true }`. Neither half alone suffices.
- **Context without the switch** → `{ authorized: false }` plus the W-1 reasons.

So W-1(3)/(4) are *bypassed for exactly one caller class* — the local single-user personal path —
and remain unmet for everything else.

### 2.3 Exact Broker Import rejection point

The Broker Import write leg is `src/ipc/brokerImportConsumer.ts` →
`persistBrokerImport` → `writer.withBrokerImportTransaction(...)`, where `writer` is
`DurablePortfolioStorePort`.

`src/persistence/durablePortfolioStorePort.ts`:

```ts
private assertWritable(): void {
  const guard = evaluatePortSaveGuard();      // ← NO authorization context
  if (!guard.authorized) throw new WriteNotAuthorizedError(guard.reasons.join('; '));
}
withBrokerImportTransaction(owner, work) { this.assertWritable(); … }
```

`evaluatePortSaveGuard()` is called with **no argument**, so it takes the default-deny branch.
`persistBrokerImport` catches `WriteNotAuthorizedError` and returns
`refusal('WRITE_NOT_AUTHORIZED', …)` with `storeEffect: 'NONE'`.

**Therefore the rejection is unconditional**: it happens regardless of
`IIPS_LOCAL_PERSONAL_USE`, regardless of provisioning, and regardless of whether every holding
qualified. The personal-use authorization reaches `src/ipc/dispatch.ts` (v1 IPC writes) but is
**never passed to the broker-import port**.

Measured (`/tmp` probe, in-memory DB seeded with an ACTIVE binding + membership, i.e. simulating a
completed Direct P1 provisioning, `IIPS_LOCAL_PERSONAL_USE=1`, both holdings fully ISIN-qualified
through the Stage 4 path):

```
{"ok":false,"code":"WRITE_NOT_AUTHORIZED",
 "message":"The Gate E W-1 write gate refused the write; no success response was produced.",
 "storeEffect":"NONE","refusedHoldings":[]}
db.isTransaction: false
portfolios=0 portfolio_revisions=0 portfolio_holdings=0 portfolio_contributions=0
```

### 2.4 Before any transaction or mutation — verified

- `assertWritable()` is the **first statement** of `withBrokerImportTransaction`, ahead of
  `this.store.withBrokerImportTransaction(...)` and ahead of any `BEGIN`.
- Probe evidence: `db.isTransaction === false` and all four portfolio tables still at 0 rows.
- The `WriteNotAuthorizedError` is raised at the port boundary, which sits *below*
  `persistBrokerImport`'s `try` — so no revision, holding, contribution or success frame is produced.
- Identity qualification (Stage 4) runs *before* the port is touched; it can only make the import
  fail earlier with `REFUSED_UNRESOLVED_IDENTITY`, never later.

**The rejection is pre-transactional and zero-effect.** This satisfies the W-15 requirement that
"Every refusal has **no store effect**."

### 2.5 Which conditions apply to the local single-user path

- W-1(1) and W-1(2) are met and are not the barrier.
- W-1(3)/(4) are the barrier **for the governed path**, and the local personal path is the one
  explicitly carved out of them — but only through `dispatch.ts`.
- The **local personal-use path is genuinely live for manual entries**: a probe against the real
  `createConnectionHandler` with `IIPS_LOCAL_PERSONAL_USE=1` and a provisioned binding executed
  `portfolio.create` (row counts 1/1/1/1). So local durable save works today for manual holdings.

### 2.6 Relevance of the existing local personal-use authorization and provisioning evidence

- `docs/LOCAL-PERSONAL-USE-PERSISTENCE.md` documents the switch, its scope and its deliberate
  exclusions — including, verbatim: "no identity resolution, no broker re-admission; **Dhan
  whole-import stays rejected**" and "Manual entries are **not** broker observations".
- `src/persistence/manualPersonalPortfolio.ts` enforces the distinction: manual rows get
  `companyId: MANUAL:<SYMBOL>`, `identityStatus: 'UNRESOLVED'`, `resolutionDisposition:
  'MANUAL_PERSONAL_ENTRY'` — permanently distinguishable from a master-resolved holding.
- Provisioning: the user reports Direct P1 provisioning succeeded. **Read-only verification in this
  sandbox was not possible** — no IPD store exists here (`~/` contains no database;
  `find / -name 'user-portfolio.sqlite' -o -name 'ipd.db'` returns only a scratch file this session
  created). I did **not** re-run provisioning and I do **not** assert it is absent. What can be said:
  provisioning produces the ACTIVE binding + membership that W-1's `context` half requires, but it
  **does not** satisfy W-1(3)/(4), and it does not change the broker-import port's context-free call.
  Background: provisioning is also separately pinned as *not* a write authorization — DP-V9 asserts
  `evaluatePortSaveGuard().authorized === false`, and Gate A′ V-A2-7 asserts `refusalPreserved`.
  Provisioning therefore cannot be the missing piece.

### 2.7 Minimum legitimate prerequisite, and what is genuinely required

**Minimum to satisfy W-1 as accepted: nothing smaller than W-1(3) and W-1(4).** Gate 4 host
qualification with a separate result-acceptance act, then a Gate 5 admission act naming qualified
commits and lifting the IRR `503` fence. Both are Program Authority decisions. No code change can
substitute for them, and this pass performs none.

**Separately — and this is the finding worth escalating — there is a structural gap independent of
W-1(3)/(4).** Even if a Program Authority act rendered both conditions and the guard were updated to
consume accepted records, the broker-import port would **still** refuse, because
`DurablePortfolioStorePort.assertWritable()` calls `evaluatePortSaveGuard()` with **no context**. Any
future admission work must also decide, explicitly and in writing:

1. whether `withBrokerImportTransaction` may receive the request's authorization context at all; and
2. if so, whether the local personal-use carve-out extends to broker-observed imports — which
   `docs/LOCAL-PERSONAL-USE-PERSISTENCE.md` §4–§5 currently **excludes by design**.

**Recommended next action:** render, in order, (a) the Gate 4 result-acceptance act, (b) the Gate 5
admission act naming the qualified commits, and (c) an explicit authority decision on whether the
broker-import port is in scope of the local personal-use carve-out or continues to require the
governed path. Items (a)–(c) are Program Authority decisions; no implementation change is authorized
by this assessment and none was made.

### 2.8 RESOLVED 2026-11-09 — the standing decision, and what was implemented

**Append-only.** §2.1–§2.7 above are the assessment as recorded on 2026-11-09 and are not rewritten.
The Program Authority then issued a standing decision resolving item (c) of §2.7 explicitly:

> The local personal-use carve-out **is** extended to broker-observed holdings for the local,
> non-production, single-user application. Implement an **explicit local single-user authorization
> path** — do **not** weaken or silently remove Gate 4 / Gate 5 globally. Supply the required
> authorization context to the durable write guard and have it validate the actual local principal,
> binding and authorization scope. Do not bypass identity qualification, transaction safeguards,
> audit integrity, revision checks or idempotency. Preserve fail-closed for invalid bindings,
> unauthorized principals and unresolved or ambiguous identities. No further approval rounds.

Items (a) and (b) — the Gate 4 result-acceptance act and the Gate 5 admission act — remain
**outstanding Program Authority decisions** and are **not** claimed. They continue to gate the
governed path. The decision addresses only item (c) and the local carve-out.

**What changed in this repository** (`main` basis `709fd13`, this branch):

| Element | Before (§2.7 finding) | After |
|---|---|---|
| `DurablePortfolioStorePort.assertWritable()` | `evaluatePortSaveGuard()` with **no context** — context branch structurally unreachable | evaluates once per mutating call; with construction options it resolves an explicit context; **without** options it still calls `evaluatePortSaveGuard()` with no context (byte-identical default deny) |
| Authorization source | none | `src/persistence/localSingleUserAuthorization.ts` — pinned server env switch **and** ACTIVE binding equal to the write's target owner+tenant; binding read in-transaction when one is already open |
| Consumer composition | `createBrokerImportConsumer(db, identityOptions)` | `createBrokerImportConsumer(db, { …identity, authorization: { env, revisionCap } })` at the same single `entrypoint.ts` call site |
| Application path | none | `src/ui/brokerImportApplicationPath.ts` — parse → qualify → preview → summary → durable request; UI identity claims structurally dropped |
| `portfolio.get` (personal path) | `contributions: []` | `contributions: []` plus projected `importEvidence[]` from the same durable ledger |
| Gate 4 / Gate 5 | NOT MET | **NOT MET — unchanged.** `evaluatePortSaveGuard()` with no context still returns the two literals; a port with no options is refused exactly as before |

**Integrated verification** (`tests/broker_import_local_authorization.test.ts`, 11 tests, all passing)
drives the real components end-to-end: BC-05 ingress on real CSV bytes → governed P04
qualification → preview with zero writes → the consumer composed by `startIpcServer` → durable
commit → `portfolio.get` over the real IPC UDS socket → merge without duplication → idempotent
re-import (`ALREADY_IMPORTED_NO_OP`, zero store effect) → retained `importEvidence` → **restart on a
fresh connection with the same database path** → cross-principal refusal → switch-off / no-binding /
revoked-binding / unrelated-flag refusal → manual path intact and distinguishable.

**Still true, and unchanged by this decision:** identity qualification is not bypassed (an
unregistered ISIN still refuses the whole import and stays unresolved); WS-A rows 44 / 51 / 63
remain unresolved with no alias and no exception; B-06 remains open; no master, corpus or mapping
was altered; `QE-1`…`QE-11` are still 0/11. This is **not** production acceptance, **not**
institutional certification, and **not** a multi-user or hosted capability.

---

## 3. Verification performed

| Check | Result |
|---|---|
| Artifact row counts (#1/#2/#3) recomputed from JSON | 1/67, 3/65, 65/3 — as documented |
| `suppliedIsin` null on all 68 rows in #1 and #2 | confirmed |
| `identifierClass` = `ISIN` on all 68 rows in #3 | confirmed |
| Rows 44/51/63 disposition, aliases, exceptions | confirmed unchanged, fail-closed |
| `priorResolutionPreservation` rows 1/21/40 | 3/3 `identical: true` |
| Appendix A reconciliation | 68 entries, 65 with expected values, **0 mismatches** |
| Pinned sha256 of `identity-outcomes-reassessment-…json` | matches the `e99989b9…` cited by the PA record |
| Pinned sha256 of `rows.json` / `source.csv` | match `bfd0496e…` / `2dc1d1fb…` |
| Stage 4 test counts | 27 + 8 = 35 (4C's "36" corrected) |
| `evaluatePortSaveGuard()` no-context | `authorized: false`, W-1(3)/(4) |
| `evaluatePortSaveGuard(ctx)` with switch + binding | `authorized: true` (personal-local) |
| Broker import port with switch on, binding present, qualified identities — **as assessed (§2.7 era, before §2.8)** | `WRITE_NOT_AUTHORIZED`, `storeEffect: NONE`, `isTransaction: false`, 0 rows |
| Same, after the 2026-11-09 authorization path (§2.8) | committed: `SAVED_NEW_BATCH`, `storeEffect: REVISION_COMMITTED`, revision 1 |
| v1 `portfolio.create` via real dispatch with switch on | executed; 1/1/1/1 rows — manual path is live |

## 4. Explicit non-claims

- No identity was invented, no mapping added, no master altered, no qualification rule relaxed, no
  unresolved row resolved, no universe expanded.
- W-1 was not weakened, reinterpreted, bypassed or implemented around; the guard, the port and the
  persistence layer are unchanged.
- No Gate 4 / Gate 5 work; no production deployment, acceptance or qualification.
- IRR untouched and read-only; no Dhan API or live-provider access.
- Broker-import durable save is no longer refused **on the explicitly authorized local single-user
  path only** (§2.8). It is **not** claimed for the governed path, not claimed as production
  acceptance, and not claimed as institutional certification. The §2.7-era "refused" measurement
  above stands as the record of what was true before that authorization.
