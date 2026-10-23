# IIPS v3.0 — CAP-02 — U2 Gate 3 Manifest Amendment (Identity Resolution, Transactions, Idempotency, Provenance) — **PROPOSED / NOT EFFECTIVE**

> ## STATUS: **PROPOSED — NOT EFFECTIVE — NO FILE AUTHORIZED — NOTHING IMPLEMENTED**
> This is a **prepared** exact-scope amendment. It has not been rendered by the Program Authority, it
> authorizes no file, and **no line of it was executed**. It exists so that the U2 work is named exactly
> instead of described generally.
>
> Read together with: CAP-02 U0 decision (effective, placement only), composition act §4
> (`IIPS-V3-CAP02-BROKER-IMPORT-UI-COMPOSITION-ACT-2026-10-23-02`, **PREPARED — NOT EFFECTIVE**), Gate E
> write policy W-1…W-16 (IPD blob `4a9501bf…`), contract v1 (IPD blob `163eb1f1…`), Gate 3 act (blob
> `4744e6f4…`) and Gate 3 acceptance (`IIPS-V3-G3-ACCEPTANCE-2026-10-22-01`).

| Field | Value |
|---|---|
| **Proposed record ID** | `IIPS-V3-CAP02-G3-AMEND-02-U2` (identifier proposed, not conferred) |
| **Record type** | Prepared exact-scope Gate 3 manifest amendment + separate provenance/schema act (PROV-2) |
| **Status** | **PROPOSED / NOT EFFECTIVE.** Implementation `NOT AUTHORIZED`. Schema `NOT AUTHORIZED`. No tracker movement |
| **Prepared** | `2026-10-23` (UTC) |
| **Baseline of this analysis** | IPD `main@73fd8c1644e9725c9a5499e14d42efdfcb4fe2f2`, tree `66020736…`; re-verified file-by-file this pass |
| **Relationship to the IPD Increment A act** | Increment A (`IIPS-V3-CAP02-IPD-EXPORT-IMPLEMENTATION-ACT-2026-10-23-01`) authorizes **export plumbing only** and expressly excludes every item below (§7 of that act). Nothing here is implied by it |
| **What rendering this would require** | A Program Authority rendering under the standing grant (or a direct PA selection), naming these exact paths, before any file below is touched |

---

## 1. Why U2 is a Gate 3 matter at all

Gate E W-1(2) requires an implementation act that "names the exact repository, IPD-`main` basis, file set
and tests **for the write path**". U2 is write-path correctness: it does not enable a write (W-1(3)/(4)
remain false), it makes the path *correct* before any future enablement. Because it touches
`src/persistence/**` — inside the Gate 3 subject matter — it requires an **amended exact manifest**. It is
not coverable by interpretation of the accepted scope.

**It does not require a contract change.** Contract v1 §6 already fixes the write payload as
`{ portfolioId, expectedRevision, mode, holdings[], contentDigest?, broker? }` and already states:

> "holdings carry broker-observed fields (symbol, ISIN, exchange, quantity, prices, broker).
> **`companyId`, `runtimeCompanyId`, `identityStatus` and `resolutionDisposition` are refused (Class P)**.
> Canonical identity is resolved IPD-side only (C12; Gate E W-6)."

So the wire is already right and IPD's implementation is behind the wire. The gap is IPD-side only, and no
wire field, operation or outcome member needs to be added. **That is the single most important finding of
this pass**, because it means U2 can be scoped without reopening contract v1.

---

## 2. U2 gap matrix — exact files, symbols, tests, authority

| ID | Gap (verified in source at `main@73fd8c16…`) | Exact location | Existing evidence | Status |
|---|---|---|---|---|
| **ID-1** | The durable import boundary requires **caller-supplied canonical identity**: `BrokerImportHolding.companyId` is a required field and `evaluateBrokerImportIdentityGate` refuses a holding whose `companyId` is empty. Nothing on the IPD side resolves `{symbol, isin, exchange}` into a canonical identity for this path. Because contract v1 refuses those keys on the wire, the boundary is **unreachable through v1** | `src/persistence/brokerImportPersistence.ts` — `BrokerImportHolding` (l. 82–96), `BrokerImportIdentityStatus` (l. 66), `evaluateBrokerImportIdentityGate` (l. 210), `mapBrokerImportHoldings` (l. 322), `persistBrokerImport` (l. 401) | `tests/q1_broker_import_durability.test.ts` constructs holdings with a literal `companyId: 'C-RELIANCE'`; `src/ipc/protocol.ts` `IPC_REFUSED_WIRE_KEYS` refuses `companyId`/`identityStatus`/`resolutionDisposition` | **OPEN** |
| **ID-2** | No provisioning or wiring of an identity-resolution **source** for the write path. The governed masters are in-memory (`getGovernedBroadSecurityMaster`, 2,250 records; `IdentityMappingStore` effective-dated in memory); `provisioning.ts` provisions only the principal **binding** | `src/identity/governed_fixture_master.ts` l. 144–184; `src/identity/mapping_store.ts` l. 24–93; `src/persistence/provisioning.ts` `provisionActiveBinding` l. 82; `src/persistence/binding.ts` `resolveActiveBinding` l. 70 | No provisioning receipt exists for a resolution source; no env flag may substitute (W-2) | **OPEN** |
| **PROV-1** | `portfolio_contributions` has **no provenance columns** (`canonical_owner_id, portfolio_id, contribution_id, amount, contributed_at, created_at`), while `computeBrokerImportProvenance` hashes `fileName`, `sourceBroker`, `importedAt`, `contentDigest`, holdings and lineage. The store therefore cannot persist what the import computes | schema: `src/persistence/migrations/001_initial_schema.ts` l. 75–85; write: `src/persistence/portfolio_store.ts` contributions `INSERT` (l. ~468–490); read: `portfolio_store.ts` `contributions()` l. 301; computation: `brokerImportPersistence.ts` `computeBrokerImportProvenance` l. 352 | Column list verified directly; `portfolio_store.ts` comment at l. 102–112 concedes the missing columns | **OPEN** |
| **PROV-2** | A contribution-model change is **outside** the accepted Gate 3 manifest and needs its own instrument | `src/persistence/migrations/001_initial_schema.ts`; a new `004_*` migration; `src/ipc/entrypoint.ts` `GATE3_MIGRATIONS` (l. 35–39) | Gate 3 act §4.1 fixes the 22 accepted paths; a migration is not among them | **OPEN** |
| **TXN-1** | **No request-wide transaction.** `persistBrokerImport` calls `writer.list(owner)` and then `writer.create`/`writer.save`; `writeRevision` performs the conflict check, the idempotency read, the `portfolio_revisions` insert, N `portfolio_holdings` inserts, the `portfolios` update and the `portfolio_contributions` insert with **no `BEGIN`/`COMMIT`** — each statement autocommits | `src/persistence/brokerImportPersistence.ts` l. 446–464; `src/persistence/portfolio_store.ts` `writeRevision` l. 380–495 (no transaction statement anywhere in the file) | `grep` for `BEGIN|COMMIT|ROLLBACK` in `portfolio_store.ts` returns only a comment (l. 398). By contrast `binding.ts` l. 71, `migration_ledger.ts` l. 86 and `provisioning.ts` l. 92 do use `BEGIN IMMEDIATE` | **OPEN** |
| **TXN-2** | No fault-injection evidence for the import path | — | No suite injects a fault between the revision insert and the contribution insert | **OPEN** |
| **TXN-3** | No revocation-race coverage on the import path | `src/persistence/binding.ts` `resolveActiveBinding` (re-validation exists for binding operations only) | No concurrent-revocation test for an import | **OPEN** |
| **IDEM-1** | The store's duplicate rule exists (contribution ledger keyed by content digest; `MERGE` returns the unchanged revision before any insert), but the import path passes `existing.revision` rather than a caller expectation, so "already imported" is not asserted through the import boundary | `portfolio_store.ts` l. 403–415; `brokerImportPersistence.ts` l. 464–476 | `tests/q1_broker_import_durability.test.ts` covers the store-level no-op and restart; the import-boundary disposition is not asserted | **OPEN (narrow)** |
| **IDEM-2** | `BrokerImportRequest` has **no `expectedRevision`**; `persistBrokerImport` reads the current revision itself. Contract v1 already requires `expectedRevision` on the wire (W-5) | `brokerImportPersistence.ts` `BrokerImportRequest` l. 98–112; read at l. 446 | No refusal exists for an omitted expectation | **OPEN** |
| **FAIL-1** | No outcome-unknown reconciliation after a transport failure: the boundary returns success/refusal only; nothing distinguishes "commit unknown" or performs a reconcile-by-read | `brokerImportPersistence.ts` `BrokerImportSuccess`/`BrokerImportRefusal` l. 146–180; `src/ipc/dispatch.ts` has no post-failure read path | IRR's `ipcClient` never retries (read-only evidence, blob `c1b885e3…`); no IPD-side reconciliation exists | **OPEN** |
| **FAIL-2** | Three states (refused / committed / outcome-unknown) are distinguishable in vocabulary but **not asserted end-to-end** at the boundary | `BrokerImportStoreEffect` = `'NONE' \| 'REVISION_COMMITTED'` — no unknown state | No test | **OPEN** |
| **DUR-1** | No commit-then-ack ordering assertion. `storeEffect: 'REVISION_COMMITTED'` is returned after `writer.save` returns; with no transaction (TXN-1) "committed" is not even a single atomic outcome | `brokerImportPersistence.ts` l. 483–489; W-11 (IPD `4a9501bf…` §W-11) | No ordering test | **OPEN** |
| **DUR-2** | `durable:true` must remain unrepresentable until Gate 4 acceptance + Gate 5 admission | `src/persistence/portfolio_store.ts` `evaluatePortSaveGuard()` returns `{ authorized: false, reasons: ['W-1(3)…', 'W-1(4)…'] }`; `src/persistence/durablePortfolioStorePort.ts` `assertWritable()` throws `WriteNotAuthorizedError` | `tests/g3_write_gate.test.ts`, `tests/g3_durability_vocabulary.test.ts` | **CORRECT AS IS — preserve, do not touch** |

**Manifest position.** Every row above lies **outside** the closed Gate 3 acceptance. U2 therefore requires
an **amended exact manifest** (PART A) plus a separate provenance/schema instrument (PART B).

---

## 3. PART A — proposed exact manifest (code, no schema)

| Path | Action | Exact change | Constraint |
|---|---|---|---|
| `src/identity/broker_observation_resolver.ts` | **new** | Resolve one raw broker observation `{symbol, isin?, exchange?}` to at most one canonical `companyId` through the governed `SecurityMaster` + effective-dated `IdentityMappingStore`; return `{ status: 'RESOLVED' \| 'UNMAPPED' \| 'AMBIGUOUS', companyId?, quarantine? }`. Pure, synchronous, no I/O, no store, no fabrication | New file only — it must **not** modify `security_master.ts`, `mapping_store.ts` or `quarantine.ts` (Gate 3 anchors `60030e0c…`, `eec60c09…`, `70c6f658…` stay byte-identical) |
| `src/persistence/brokerImportPersistence.ts` | **modify** | (a) accept an injected resolver and a **raw-observation** holding shape; (b) refuse the whole request with `storeEffect:'NONE'` when any holding is `UNMAPPED`/`AMBIGUOUS`, with per-holding quarantine evidence; (c) make `expectedRevision` **mandatory** on `BrokerImportRequest` and refuse its omission with a typed code; (d) return an explicit `OUTCOME_UNKNOWN` state and a reconcile-by-read entry point; (e) assert the duplicate disposition through the boundary | No change to the refusal vocabulary semantics already consumed by callers; no new wire field; no write enablement |
| `src/persistence/portfolio_store.ts` | **modify** | Wrap the mutations of `writeRevision` (and `create`/`reset`/`delete`) in one `BEGIN IMMEDIATE … COMMIT` with `ROLLBACK` on any failure; add one request-scoped entry point that performs binding re-validation, revision check, idempotency check and every mutation inside that transaction. Revision arithmetic, W-10 operation semantics and idempotency rules are unchanged | `evaluatePortSaveGuard()` must remain hard-false; no new durability claim; no change to the schema in this part |
| `src/persistence/binding.ts` | **read-only reuse** | `resolveActiveBinding` is called **inside** the new transaction; the module itself is unchanged | No edit authorized |
| `src/ipc/dispatch.ts` | **unchanged** | The write gate keeps refusing before dispatch; **no handler is added** by this amendment. Wiring the boundary to the dispatcher is a later act after U3–U6 | Any diff here fails the amendment |
| `src/ipc/protocol.ts` | **unchanged** | Closed operation set, framing, C7 refusal list and Class A/B vocabulary untouched | Any diff here fails the amendment |

**Explicitly out of scope for PART A:** the schema, the audit chain, the migration ledger, the IPC
contract, any route, any renderer surface, any IRR file, the W-1 guard, and enabling a write.

## 4. PART B — proposed provenance/schema act (PROV-2), separately rendered

| Path | Action | Exact change |
|---|---|---|
| `src/persistence/migrations/004_portfolio_contribution_provenance.ts` | **new** | Additive columns to `portfolio_contributions`: `file_name`, `source_broker`, `content_digest`, `lineage_digest`, `imported_at`, `contribution_semantics` (`SAVED_NEW_BATCH` / `MERGED_INTO_EXISTING` / `RESET` / `REPLACE`), with the existing primary key unchanged. No column dropped, renamed or retyped |
| `src/ipc/entrypoint.ts` | **modify** | Register the migration in `GATE3_MIGRATIONS` (l. 35–39). Nothing else |
| `src/persistence/portfolio_store.ts` | **modify** | Write the new columns in the contributions `INSERT`; return them from `contributions()`; keep every existing projection field |
| `src/persistence/brokerImportPersistence.ts` | **modify** | Pass the computed provenance through unchanged — no field silently dropped |

Mapping rule: every field hashed by `computeBrokerImportProvenance` must be recoverable from the store, and
no existing column may change meaning.

## 5. Proposed test manifest

| ID | Test | Pass condition | Part |
|---|---|---|---|
| `T-U2-1` | Raw-observation resolution | a request carrying only broker-observed fields resolves to canonical holdings IPD-side; a request carrying any canonical key is still refused (C7) | A |
| `T-U2-2` | Zero / ambiguous resolution | the **whole** request is refused with `storeEffect:'NONE'` and per-holding evidence; no row written | A |
| `T-U2-3` | Mandatory `expectedRevision` | omission and mismatch are typed refusals; no mutation | A |
| `T-U2-4` | Request-wide transaction | one `BEGIN IMMEDIATE` per import; every check inside it; a fault injected at each statement boundary leaves the store byte-identical to its pre-request state | A |
| `T-U2-5` | Revocation race | a revocation committing during the request refuses the write at commit time | A |
| `T-U2-6` | Idempotency before/after restart | duplicate import ⇒ `ALREADY_IMPORTED_NO_OP`, no new revision, before and after restart | A |
| `T-U2-7` | Outcome unknown | a transport failure yields `OUTCOME_UNKNOWN` (never success, never silent failure) and reconciliation by read reports the true state | A |
| `T-U2-8` | Commit-then-ack ordering | the ack is produced only after `COMMIT`; the gate still refuses with zero effect | A |
| `T-U2-9` | Provenance round-trip | `fileName` / `sourceBroker` / `importedAt` / digests recoverable from the store after a restart; no field silently dropped | B |
| `T-U2-10` | Gate unchanged | `evaluatePortSaveGuard()` is still hard-false; `WRITE_NOT_AUTHORIZED` still precedes dispatch; `durable:true` unrepresentable | A |

Each test is a correctness test on a path that remains **unreachable in production** while W-1(3)/(4) are
unmet. Passing them is **not** Gate 4 qualification, **not** result acceptance and **not** admission.

## 6. Exclusions (would remain excluded even if rendered)

1. No IPC operation, wire field, framing or outcome-member change; no contract revision.
2. No write enablement; W-1(3)/(4) stay false; `durable:true` stays unrepresentable.
3. No change to the W-1 guard, the twelve IRR `503` route-method pairs, or any IRR file.
4. No route, renderer surface, navigation entry or Increment B/C work.
5. No new SecurityMaster, mapping store or second identity authority; no fixture fabrication.
6. No Gate 4 execution/acceptance, no Gate 5, no production claim, no G24 revival, no retroactive PR #45
   authorization.
7. No change to Gate 3 anchors `security_master.ts`, `mapping_store.ts`, `quarantine.ts`, `tsconfig.json`,
   `ci.yml`, `vite.config.ts`, `portfolio-store.ts`, `portfolioStorePort.ts`, `package-lock.json`.

## 7. Why it must not be done now

1. It is **not rendered**; a proposal is not authority (composition act §7, R-3/R-6).
2. Rendering it would be a PA-reserved write-path determination: the smallest item alone (`expectedRevision`
   becoming mandatory) changes the boundary's semantics and its callers' obligations.
3. PART B changes the schema and the contribution model — a class of change that requires its own act
   wherever it has been addressed in this program.
4. No user-visible capability is gained: with W-1(3)/(4) unmet the path refuses regardless, and Increment C
   additionally needs U7.

**Exact next executable step:** the Program Authority renders (or declines) this amendment. Until then the
correct state is: `U2 OPEN; unchanged; unrendered.`

---

## 8. Status statement

```text
U2 Gate 3 manifest amendment:   PROPOSED — NOT EFFECTIVE — nothing implemented
U2 identity resolution (ID-1/2): OPEN
U2 transaction coverage (TXN-*): OPEN
U2 idempotency (IDEM-*):         OPEN (narrow)
U2 reconciliation (FAIL-*):      OPEN
U2 provenance/schema (PROV-*):   OPEN — separate instrument required
U2 durability ordering (DUR-1):  OPEN (DUR-2 correct as is)
Contract v1 / wire:              UNCHANGED and sufficient — no revision needed
Gate 3 acceptance:               UNCHANGED (bounded 22-path scope only)
Writes / gates:                  WRITE_NOT_AUTHORIZED; durable:false; 12 IRR pairs 503
```

*Prepared under the standing grant; renders no decision; authorizes no file; performs nothing.*
