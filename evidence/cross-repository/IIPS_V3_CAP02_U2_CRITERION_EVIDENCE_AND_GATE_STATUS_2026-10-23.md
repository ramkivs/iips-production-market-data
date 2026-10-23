# CAP-02 — U2 criterion-to-evidence reconciliation and U2–U6 gate status

**Record ID:** `IIPS-V3-CAP02-U2-CRITERION-EVIDENCE-AND-GATE-STATUS-2026-10-23-01`
**Status:** investigation, reconciliation and qualification evidence only. This record **accepts no
result** and **moves no gate**. It records what the merged U2 implementation actually satisfies, what
evidence exists for it, what remains genuinely open, and the exact status of U2/U3/U4/U5/U6.

| Field | Value |
|---|---|
| Repository | `ramkivs/iips-production-market-data` (IPD) |
| Verified baseline at inspection | `main@04e63edd995889b170eed6660e7010dd32e15fd3`, tree `3949ab645697d8c7c26dd5e5708c43bcdcd71cec`, working tree clean |
| Inspected decisions | `IIPS-V3-CAP02-G3-AMEND-02-U2` (Part A), `IIPS-V3-CAP02-U2-PROVENANCE-SCHEMA-ACT-2026-10-23-01` (Part B), `IIPS-V3-CAP02-U2-TRANSACTION-BINDING-REVALIDATION` (supplemental), `IIPS-V3-CAP02-U2-WRITE-GUARD-ADAPTER` (supplemental), `IIPS-V3-CAP02-IPD-EXPORT-IMPLEMENTATION-ACT-2026-10-23-01` (Increment A), Gate E W-1 (W-1(1)–W-1(4)) |
| Inspected source | `src/identity/broker_observation_resolver.ts`, `src/persistence/brokerImportPersistence.ts`, `src/persistence/portfolio_store.ts`, `src/persistence/binding.ts`, `src/persistence/durablePortfolioStorePort.ts`, `src/persistence/migrations/001…004`, `src/ipc/{entrypoint,dispatch,protocol}.ts`, `tests/q1_broker_import_durability.test.ts`, `tests/g3_write_gate.test.ts`, `tests/g3_durability_vocabulary.test.ts` |
| Method | Source and executed tests, not commit messages or tracker labels. Every row below was re-derived from the current tree. |

## 1. Workstream A — U2 criterion-to-evidence matrix

Classification key: **1** implemented & verified · **2** implemented, evidence gap · **3** incomplete
or defective · **4** outside effective scope · **5** needs a separate effective decision ·
**6** dependent on IRR consumer/host behaviour · **7** not applicable to the first CAP-02 surface.

| # | Requirement / invariant | Effective authority | Source implementation | Test + result | Remaining gap | Closure condition | Class |
|---|---|---|---|---|---|---|---|
| U2-1 | Caller supplies broker-observed fields only; canonical identity is resolved IPD-side; `companyId`/`runtimeCompanyId`/`identityStatus`/`resolutionDisposition`/owner/tenant claims are refused at the import boundary | Part A §3.1 | `brokerImportPersistence.validateRequest` + `findRefusedBrokerKeys`; `portfolio_store.findCallerSuppliedIdentityKeys`; `ipc/protocol` + `ipc/dispatch` pre-existing refusal | `q1_broker_import_durability` → "requires expectedRevision and rejects caller-supplied canonical identity claims" (**pass**); `g3_caller_authority` (**pass**) | none | — | **1** |
| U2-2 | Every holding resolves to exactly one governed canonical identity, or the whole request refuses with zero store effect and per-item evidence | Part A §2, §3.2 | `resolveHoldings` + `broker_observation_resolver.ts` (all supplied identifiers must resolve *and* agree; missing exchange ⇒ ambiguous; collision ⇒ ambiguous) | `q1_broker_import_durability` → "resolves raw broker observations…", "refuses contradictory broker-observed identifiers…", "refuses a symbol without an explicit exchange", "never persists a holding whose identity was refused" (**4 pass**) | none | — | **1** |
| U2-3 | The resolution source must be the governed D05 master revision; a non-governed source fails closed | Part A §2 (governed SecurityMaster, no new master/fixture fabrication) | `createGovernedBrokerObservationResolver` validates `recordCount === 2250`, 64-hex checksum and the D05 authorization reference at construction | **Added this pass** in `q1_broker_import_durability` → "refuses to resolve identity against a non-governed source" (**pass**) | none | — | **1** (evidence completed this pass) |
| U2-4 | Request-wide atomicity: one `BEGIN IMMEDIATE` / `COMMIT`, rollback of the complete effect on any error | Part A §2 (`portfolio_store.ts`), §3.3 | `DurablePortfolioStore.withTransaction` + `withBrokerImportTransaction`; nested store calls re-enter the same transaction (`transactionDepth`) | `q1_broker_import_durability` → "rolls every portfolio/revision/holding/contribution statement back on injected faults" — six fault points, full-database snapshot equality before/after (**pass**) | none | — | **1** |
| U2-5 | The active owner binding is revalidated **inside** the import transaction; revocation is serialized against the import | Part A §3.5; revalidation amendment (`resolveActiveBindingInCurrentTransaction`) | `binding.ts` shared predicate; `withBrokerImportTransaction` resolves and compares `canonicalOwnerId`/`tenantId` before any mutation | `q1_broker_import_durability` → "**T-U2-5: serializes a competing revocation against the ACTUAL import transaction**" (**added this pass, pass**), "fails closed on absent, duplicated and inconsistent ACTIVE binding data" (**added this pass, pass**), "revalidates revocation inside the request transaction…" (**pass**) | none | — | **1** (evidence strengthened this pass) |
| U2-6 | `expectedRevision` is mandatory, runtime-validated, and is the caller's compare-and-swap token — never silently replaced by a freshly read revision | Part A §3.4 | `validateRequest` (non-negative integer required); `run()` rejects a non-zero expectation on create and passes the caller's token to `save` | `q1_broker_import_durability` → "requires expectedRevision and rejects caller-supplied canonical identity claims" (**pass**) | none | — | **1** |
| U2-7 | Same-content duplicate is an explicit no-op with no new revision and no duplicate contribution; a replay of an *earlier* file is also a no-op | Part A §3.4; Gate E W-8 / BI-08 | `writeRevision` contribution-ledger duplicate check; `persistBrokerImport` maps `revision === expectedRevision` to `ALREADY_IMPORTED_NO_OP` | `q1_broker_import_durability` → "…is idempotent", "treats a re-import of an EARLIER broker file as a duplicate" (**2 pass**) | none | — | **1** |
| U2-8 | A lost commit acknowledgement is `OUTCOME_UNKNOWN`, distinct from refusal and from success; no automatic retry; reconciliation by authoritative read | Part A §3.6 | `CommitOutcomeUnknownError` raised only when `COMMIT` was attempted and the connection state is indeterminate; `reconcileBrokerImportByRead` | `q1_broker_import_durability` → "returns an explicit unknown result after commit acknowledgement loss and reconciles by read" — asserts `ok:'unknown'`, `storeEffect:'OUTCOME_UNKNOWN'`, reconciliation `COMMITTED`, exactly one revision (**pass**) | none on the persistence side | — | **1** (persistence) / **6** (consumer rendering — see the U7 act) |
| U2-9 | A success acknowledgement is produced only after `COMMIT` | Part A §3.7 | `withTransaction` sets `commitAttempted` before `COMMIT`, invokes `afterCommit` after it, and returns the result only after that | Proven indirectly and exactly by U2-8's test: an `afterCommit` fault (i.e. after the commit succeeded, before the ack) yields `OUTCOME_UNKNOWN`, never a success (**pass**) | none | — | **1** |
| U2-10 | Provenance: six additive nullable columns, NULL (never fabricated) on historical rows, required and validated for new broker imports, returned by the contribution read projection | Part B §1, §2 | migration `004_portfolio_contribution_provenance` (additive `ALTER TABLE`, CHECK-constrained semantics); `writeRevision` insert; `contributions()` read projection; `entrypoint.GATE3_MIGRATIONS` registers 004 after 001–003 | `q1_broker_import_durability` → all six fields asserted on insert and after restart (deterministic digest; `SAVED_NEW_BATCH`); "upgrades an existing 001–003 database without inventing historical provenance" (six NULLs, ledger applied twice ⇒ idempotent) (**pass**) | none | — | **1** |
| U2-11 | Migration 001 remains byte-identical; migration history is checksummed and not rewritten | Part B §1, §4 | `001_initial_schema.ts` blob `f594a18264c45ccdcbfa2381592820a72d3c453b` (unchanged); `migration_ledger` checksums | `q1_broker_import_durability` migration test + `g3_startup_validation` (**pass**) | none | — | **1** |
| U2-12 | The W-1 write gate stays hard false and refuses **before** any transaction or callback; `WRITE_NOT_AUTHORIZED` before dispatch | Gate E W-1; supplemental write-guard adapter act §2 | `evaluatePortSaveGuard()` returns `authorized:false` unconditionally; `DurablePortfolioStorePort.withBrokerImportTransaction` calls `assertWritable()` first; `ipc/dispatch` returns `WRITE_NOT_AUTHORIZED` pre-mutation | `q1_broker_import_durability` → "the W-1 write gate refuses the import with zero store effect" (incl. `callbackInvoked === false`) (**pass**); `g3_write_gate`, `g3_durability_vocabulary`, `g3_caller_authority` (**pass**) | none | — | **1** |
| U2-13 | No operational write, no `durable:true`, no production claim follows from any of the above | Gate E W-1(3)/(4) | `evaluatePortSaveGuard` reasons are literally W-1(3)/W-1(4) | as U2-12 | **Operational write authority is a separate gate decision, not an implementation fact** | Effective U6 decision satisfying W-1 | **5** |
| U2-14 | Binding **provisioning** for a real operator identity | *Not authorised by any U2 act* — Part A, Part B and the revalidation amendment all expressly exclude provisioning | `src/persistence/provisioning.ts` is library-only and unreachable from `ipc/**` and startup; mutating entrypoint requires a module-private `unique symbol` brand no in-repo code can mint; `provisionActiveBinding` refuses before any SQL | `non_production_operator_identity_bypass`, `g3_startup_validation` (static unreachability) (**pass**) | **No identity was provisioned, and this pass did not provision one.** Provisioning is an operational identity write, not a persistence-code gap | Effective provisioning/Gate A′ execution decision, then a controlled operator action | **5** |
| U2-15 | G2 seven-field / three-rename view gap; `fileName`/`importedAt` in the v1 save payload | — | v1 projection intentionally omits these | — | Outside the U2 manifest | Its own read-contract act if ever needed | **7** |
| U2-16 | Full G2 list/full view, revision history, workspace analytics | — | — | — | Explicitly outside the first CAP-02 surface | Own decision | **7** |

### Verdict

Every **implementation** criterion of the effective U2 Part A + Part B + both supplements is
satisfied and has executed, published evidence. Two evidence items were thin and were completed in
this pass (U2-3 governed-source rejection; U2-5 serialization proven on the real import path, plus
absent/duplicate/mismatched binding shapes). Nothing was found defective; no regression was found
in the merged PR #52 implementation.

The two remaining U2-adjacent items are **not implementation defects** and are **not** closable by
code: U2-14 (provisioning a real identity) and U2-13 (operational write authority). Both are
authority-bound, and this pass records them as such rather than inferring them from a merged PR.

### What "U2 closed" does and does not mean

Per §3 of the effective Part A act, "U2 completion" meant *implementation/evidence/publication
complete*. That condition is now met on IPD `main` **for the Part A/Part B manifests**, and this
record states that explicitly. It does **not** mean, and this record does **not** claim:
Gate 4 qualification, U4 result acceptance, Gate 5 admission, U6 write authorisation, or end-to-end
integration. Those are separate gates with separate effective decisions (see §2).

## 2. Workstreams B–E — U3/U4/U5/U6 gate status

### B. U3 / Gate 4 qualification — **NOT QUALIFIED**

Gate 4 is not a test-run. Its admission condition is the Gate E W-1(3) conjunction, and
`evaluatePortSaveGuard()` returns it as unmet by construction. What this pass could do, it did:
it executed the exact IPD-local qualification matrix and recorded it.

| Step | Command | Exit | Result |
|---|---|---|---|
| Typecheck | `npx tsc --noEmit` | 0 | clean |
| Production build | `npm run build` | 0 | `tsc` + `vite build` + `build:portfolio-ui-package`; only the pre-existing >500 kB chunk advisory |
| Full suite | `npm test` | 0 | **848 executed · 847 passed · 0 failed · 1 skipped** (116 suites) |
| Focused durability matrix | `node --test dist/tests/q1_broker_import_durability.test.js` | 0 | **18 / 18** (was 15) |
| Focused U7 provider matrix | `node --test dist/tests/q1_cap02_u7_provider_outcomes.test.js` | 0 | **10 / 10** (new) |
| Gate assemblies | `dist/tests/g3_write_gate` · `g3_durability_vocabulary` · `g3_caller_authority` · `g3_binding_resolution` | 0 | pass |
| Whitespace | `git diff --check` | 0 | clean |

Coverage of the Workstream B items: migration and transaction behaviour (U2-4, U2-10, U2-11);
failure and unknown-outcome recovery (U2-8); active-binding revocation serialization (U2-5);
expected-revision and idempotency (U2-6, U2-7); commit/acknowledgement ordering (U2-9);
write-denial invariants (U2-12).

**Still unproven, and not provable in IPD alone:**

| Missing qualification evidence | Owner | Why IPD cannot supply it | Closure condition |
|---|---|---|---|
| Execution on the target Windows host, with operator-supplied database path and IPC endpoint, under the frozen Gate 3 topology | IPD + target host | This pass ran on a Linux sandbox against an OS-temp fixture database; a Linux fixture run is not a Windows target-host result and must not be reported as one | Recorded target-host run with exact host identity, commands, exit codes and test counts |
| Durability of a committed import across a target-host process restart under the real operator store | IPD + target host | No operator store is opened by any authorised act | Same, plus an authorised store path |
| `durable:true` end-to-end acknowledgement | U6 decision first | `WRITE_NOT_AUTHORIZED` refuses every write; no durable path exists to qualify | Effective U6 authorisation |
| Cross-repository end-to-end: modal mounted in a host, real IPC transport, real receipt | IRR (composition) + IPD | IRR's effective composition act does not mount the modal; no IRR port implementation exists | IRR repin to the IPD commit that lands this pass, then IRR-side mount + end-to-end evidence |

**Gate 4: not qualified. Not marked passed.**

### C. U4 — result acceptance: **NOT RENDERED**

Acceptance requires actual Gate 4 results. Gate 4 is not qualified (§B). Nothing in this pass —
no green CI, no merged PR, no test count — is evidence of acceptance. The unmet criterion is
identifier `G4-ALL`: an effective Gate 4 qualification covering the rows above.

### D. U5 — Gate 5 admission: **NOT GRANTED**

Gate 5 depends on U4 acceptance, which is not rendered. U2 implementation, Gate 4 preparation and
U4 acceptance are not collapsed into a Gate 5 grant. U3, U4 and U5 remain three separate statuses.

### E. U6 — operational write authorisation: **NOT AUTHORIZED**

W-1(3) and W-1(4) are both unmet. `WRITE_NOT_AUTHORIZED` is preserved and enforced; the only shipped
port declares `SESSION_ONLY` / `durable:false`. The U7 provider act that lands with this record
*strengthens* this: durability display is now receipt-driven, so no surface can render a durable
commit without an authoritative receipt that says `durable:true` — which the shipped adapter never
emits.

## 3. Workstream G — binding provisioning: revalidated, precisely blocked

| Question | Finding |
|---|---|
| Is a provisioning implementation missing? | **No.** `src/persistence/provisioning.ts` is complete for its authorised shape: pure statement builder, read-only inspector, and a single mutating entrypoint that refuses unless handed a `GateAPrimeAuthorization` brand mintable only inside that module. No IPC/startup module imports it (`g3_startup_validation` static assertion). |
| Does U2 require provisioning to satisfy its invariants? | **No.** U2 requires that a write *revalidate* the active binding inside its transaction. It does not require IPD to create one. The tests construct fixtures for exactly that purpose. |
| Is provisioning authorised? | **No.** Part A, Part B and the revalidation amendment each expressly exclude provisioning. Gate A′ is recorded APPROVED / NOT EXECUTED. |
| What remains | An effective provisioning/Gate A′ execution decision (authority) and then a controlled operator action. This is an operational identity write, so the standing PA grant's routine-authorisation construction does not reach it, and there is no ungoverned fallback here: caller-controlled canonical identity is refused end to end. |
| Closure evidence | The effective decision, then `inspectBindings()` showing exactly one ACTIVE binding and one ACTIVE membership, then a U2 import exercised against it with the absent/duplicate/mismatched cases still failing closed. |

## 4. Status statement

```text
U2 Part A + Part B implementation:   COMPLETE and verified on IPD main (this pass re-derived every row)
U2 evidence gaps found:              2 (both closed this pass); 0 defects, 0 regressions
U2-14 provisioning:                  NOT DONE — authority-blocked, not an implementation gap
U2-13 / U6 operational write:        NOT AUTHORIZED — W-1(3), W-1(4) unmet
U3 / Gate 4 qualification:           NOT QUALIFIED — IPD-local matrix executed and recorded; target-host evidence absent
U4 result acceptance:                NOT RENDERED — requires actual Gate 4 results
U5 Gate 5 admission:                 NOT GRANTED — depends on U4
U6 operational writes:               NOT AUTHORIZED; WRITE_NOT_AUTHORIZED preserved; durable:false preserved
End-to-end integration:              NOT CLAIMED — IRR composition/mount is IRR's own effective scope
```

*This record accepts nothing and promotes nothing. It replaces label-based gate claims with
source-and-execution evidence.*
