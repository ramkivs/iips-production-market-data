# CAP-03 — Row 28 durable broker-import: admission decision packet — **PROPOSED — NOT EFFECTIVE**

> ## STATUS: **DECISION PACKET — NO DECISION RENDERED**
>
> This instrument **requests** a Program Authority decision. It renders none. No admission is granted,
> no gate moves, no fence lifts, no write is enabled, and no status in this packet is effective until the
> Program Authority renders the decision and it is published to `ramkivs/iips-production-market-data`
> `refs/heads/main` with green CI and independent remote read-back.
>
> **Nothing was implemented, wired, provisioned or accepted in the pass that produced this packet.**
> The consumer-implementation step was **stopped at an authority boundary** and the reason is recorded
> at §7.

| Field | Value |
|---|---|
| **Record type** | Program Authority decision request — durable broker-import path admission (capability-matrix row 28) |
| **Requested decision ID** | `IIPS-V3-CAP03-ROW28-DURABLE-BROKER-IMPORT-ADMISSION-ACT-2026-10-28-01` (census at the time of writing: **`0` occurrences** in either repository — the string is reserved, not assigned) |
| **Prepared** | `2026-10-28` (UTC) |
| **Deciding authority** | **Ramki — Program Authority**, cross-repository capacity (the capacity that rendered Gate 3, the Gate 4 target-host qualification act, and the Gate A′ successor provisioning act) |
| **Repository and locus** | `ramkivs/iips-production-market-data`. **IRR is read-only in this pass** and was not written |
| **IPD basis** | `refs/heads/main` @ **`b9dd6fce48fafba8ca6095debefb62fd54234f85`**, tree **`34ee1a3b97b787a4bdbc6d27943c6c4cfb1f6f6f`** (live remote read; `0` open PRs) |
| **Capability-matrix row** | Row 28 — *Broker ingestion chain (IPD)*, in `IIPS_V3_CAPABILITY_MATRIX_51x17_2026-10-28.xlsx`, record `IIPS-V3-CAPMATRIX-51X17-RECONCILIATION-2026-10-28-01` |
| **Scope requested** | Non-production, single-user, personal-use only. **No production admission, no production deployment, no scope expansion** |
| **Supersedes** | The `O-05` label "`GOV-03`/`BI-08` admission act" — **that label is wrong**; see §3 |

---

## 1. What is being asked

A single Program Authority decision on whether, and under what exact scope, a **production-code consumer**
in the non-production IIPS application may be wired to the durable broker-import persistence port
(`DurablePortfolioStorePort`), and what evidence will constitute admission of that path.

The decision is required because the port's write gate is **fail-closed by design and cannot be satisfied
by any implementation, test, environment flag or operator assertion**. Only a rendered admission can
change it. Wiring a consumer without that decision would add a code path whose only demonstrable
behaviour is refusal.

## 2. The five states, kept separate

These must not be collapsed into one completion flag. Each has its own evidence and its own authority.

| # | State | Current verified disposition | Evidence |
|---|---|---|---|
| **1** | **Durable persistence implementation exists** | **YES — SATISFIED** | `src/persistence/portfolio_store.ts` (`DurablePortfolioStore`, migrations `001`–`004`), `src/persistence/durablePortfolioStorePort.ts` (89 lines), `src/persistence/brokerImportPersistence.ts` (356 lines) |
| **2** | **A runtime consumer is wired to the persistence port** | **NO — NOT WIRED** | `git grep` at `b9dd6fce`: **`0`** non-test importers of `durablePortfolioStorePort` / `brokerImportPersistence` under `src/` or `scripts/`. The only importers are `tests/g3_durability_vocabulary.test.ts` and `tests/q1_broker_import_durability.test.ts` |
| **3** | **The consumer is authorized for the specified non-production scope** | **NO — NOT AUTHORIZED** | `evaluatePortSaveGuard()` (`src/persistence/portfolio_store.ts:213-217`) returns `authorized: false` with `W-1(3): Gate 4 qualification not accepted` and `W-1(4): Gate 5 admission not accepted`. Its own comment: *"both false in this build, so the guard can never authorize. No environment flag, test result or operator assertion changes this."* |
| **4** | **Runtime qualification has passed** | **NO — NOT STARTED** | Gate 4 act §6: `QE-1…QE-11` at step **S4** is `BLOCKED` until **S3**, which is `BLOCKED` until **S1** and **S2a**. `QE 0/11` |
| **5** | **The durable broker-import path has been accepted for that scope** | **NO — NOT GRANTED** | Gate 4 act §6 step **S6**: *"Dispositions: Gate C acceptance → Gate 4 result acceptance → Gate 5 — **NOT GRANTED** — separate acts"* |

**States 2–5 are all outstanding. Only state 1 is satisfied.**

## 3. The governing admission act — and the correction to the `O-05` label

The capability matrix and the IRR tracker record row 28's blocker as *"`GOV-03`/`BI-08` admission act"*.
**Neither identifier is an admission act.** Verified in this pass:

| Identifier | What it actually is | Evidence |
|---|---|---|
| `GOV-03` | An **implementation work item** — *"GOV-03 durable broker-import boundary"* — executed and published via IRR PR #197 on `2026-10-22`. Its own record states: *"**Outstanding acts — GOV-03 is NOT complete, and is not marked complete.** Implementation authority is not qualification authority."* | IRR tracker §16.81, §16.81.6; §16.82 |
| `BI-08` | The **idempotent-ingress contract** (`ALREADY_IMPORTED_NO_OP`), implemented in `frontend/src/features/portfolio/portfolio-store.ts` and tested by `tests/bi08_idempotent_ingress.test.ts`. It is a behavioural contract, not a governance instrument | `docs/FULL_IIPS_BI08_CONVERGENCE_PLAN.md` §11, §12.5; `docs/FULL_IIPS_BI08_CONVERGENCE_FILE_MATRIX.md` §12.5 |

**The actual governing instruments are the Gate 4 and Gate 5 acts**, and the chain between them:

| Step | Instrument | Owner | Verified status at `b9dd6fce` |
|---|---|---|---|
| **S1** | Gate A′ successor provisioning (**P-1**) | Program Authority → host executor | **BLOCKED.** Successor act effective, but `P-1 NOT EXECUTED / UNSPENT / NOT AUTHORIZED`; no store exists. *"The chain is currently stopped at S1 by a value that no agent may select."* |
| **S2 / S2a** | Limb A implementation → merge → native-Windows canonical `npm test`; H-12 regeneration + separate express PA adoption | Program Authority / host | `AUTHORIZED — NOT STARTED`; `H-12 NOT ADOPTED` |
| **S3** | Host/runtime preflight (`win32`, non-elevated, Node `>=22.13.0 <23`, flag-free `node:sqlite`) | host executor | **BLOCKED** until S1 and S2a |
| **S4** | `QE-1…QE-11` execution — including **QE-4** stop-and-restart-both-processes read-back, **QE-5** idempotent re-import, **QE-6** contribution lineage | host executor | **BLOCKED** until S3. `0/11` |
| **S6** | Gate C acceptance → **Gate 4 result-acceptance act** → **Gate 5 admission act (`CV-52`)** | Program Authority | **NOT GRANTED — separate acts.** `CV-52` `BLOCKED – ACTIVE`; Gate 5 `NOT INITIATED / NOT ADMITTED` |

**Correction recorded:** the Gate 4 target-host qualification authority act
(`IIPS-V3-G4-TARGET-HOST-QUALIFICATION-AUTHORITY-ACT-2026-10-23-01`) is **RENDERED and EFFECTIVE** —
`AUTHORIZED — NOT STARTED`. IRR tracker §16.81.6 (2026-10-22) still records it as
`PROPOSED — NOT EFFECTIVE`; that line is **stale**. Gate 4 *authority* exists. Gate 4 *execution* and
*acceptance* do not.

**Therefore the decision requested here is not the Gate 4 authority act — it is the pair of S6 acts**
(Gate 4 result acceptance, then Gate 5 admission naming the durable broker-import operations), which are
prerequisite to state 3 and cannot be rendered before states 4's evidence exists.

## 4. What is already proven, and what is not

This distinction is the whole basis of the request. The durable logic is **not** untested — it is
thoroughly tested **against the bare store**. What is untested is the **governed production path**,
because that path must traverse the port, and the port correctly refuses.

`persistBrokerImport(writer: BrokerImportWriter, …)` is writer-agnostic
(`src/persistence/brokerImportPersistence.ts:239`). Both `DurablePortfolioStore` (no gate) and
`DurablePortfolioStorePort` (W-1 gate at every mutation) satisfy `BrokerImportWriter`
(`brokerImportPersistence.ts:195-201`).

### 4.1 Proven through the **port** (the production path) — all refusals

`tests/q1_broker_import_durability.test.ts`, *"the W-1 write gate refuses the import with zero store effect"*:

| Assertion | Observed |
|---|---|
| `persistBrokerImport(port, …)` outcome | `ok: false`, `code: 'WRITE_NOT_AUTHORIZED'`, `storeEffect: 'NONE'` |
| Row count before vs after | **identical** — *"no row was created, changed or deleted"* |
| `port.withBrokerImportTransaction(OWNER, cb)` | throws `WriteNotAuthorizedError`; `callbackInvoked === false` — *"W-1 refuses before evaluating the transaction callback"* |
| Database transaction state | `db.isTransaction === false` — *"W-1 refuses before beginning a database transaction"* |

`tests/g3_write_gate.test.ts` additionally proves *"no environment flag combination can enable a write"*,
the immutable `1→2→3→4` revision lifecycle, `RevisionConflictError` on a stale expected revision,
identical-content idempotent no-op, and invalid-request rejection with `RESOURCE_UNAVAILABLE` tombstone
collapse.

### 4.2 Proven through the **bare store** (qualification fixture) — the full durable path

`tests/q1_broker_import_durability.test.ts`, *"the durable import on a qualification fixture"* — these
construct `new DurablePortfolioStore(db)` directly, **bypassing the port**, and therefore exercise the
durable machinery without the W-1 gate:

| Case | What it proves |
|---|---|
| *"commits an import, survives a store restart and a separate process restart, and is idempotent"* | **restart durability**, incl. a separate-process reopen (`new DurablePortfolioStore(reopened)`) |
| *"treats a re-import of an EARLIER broker file as a duplicate, not a second application"* | duplicate/replay policy |
| *"never persists a holding whose identity was refused"* | fail-closed identity propagation into persistence |
| *"requires expectedRevision and rejects caller-supplied canonical identity claims"* | no forged identity, no default revision |
| *"rolls every portfolio/revision/holding/contribution statement back on injected faults"* | atomicity across all four statement classes |
| *"returns an explicit unknown result after commit acknowledgement loss and reconciles by read"* | `BrokerImportOutcomeUnknown` + `reconcileBrokerImportByRead` |
| *"revalidates revocation inside the request transaction and keeps the transaction owner intact"* | in-transaction revocation |
| *"T-U2-5: serializes a competing revocation against the ACTUAL import transaction"* | real concurrency, not a mocked race |
| *"fails closed on absent, duplicated and inconsistent ACTIVE binding data"* | binding-integrity fail-closed |
| *"upgrades an existing 001–003 database without inventing historical provenance"* | migration honesty |

Plus the governed identity gate (`UNMAPPED_IDENTIFIER`, `AMBIGUOUS_COLLISION`, `MISSING_EXCHANGE`,
non-governed-source refusal, full-resolution acceptance) and the deterministic mapping (verbatim values,
provenance digest bound to the originating broker file).

### 4.3 The gap

**No executed evidence exists that the intended application flow reaches a durable persistence operation.**
State 2 is false and state 3 is false, so no such evidence can exist until admission is rendered.
Automated tests at §4.2 are **component evidence on a fixture**, not runtime qualification and not
acceptance — per the Gate 4 act's own tiering.

## 5. Proposed scope, if the decision is granted

Minimum-change proposal. Nothing here is authorized by this packet.

| Element | Proposal |
|---|---|
| **Consumer** | One production-code entry point in the non-production application that receives a broker-import request and calls `persistBrokerImport(port, owner, request)` — `port` being a `DurablePortfolioStorePort`, never a bare `DurablePortfolioStore` |
| **Boundary** | Reached **only** through the established IPC/API boundary. No direct store import, no new persistence mechanism, no duplicate store |
| **Write gate** | `evaluatePortSaveGuard()` is **not modified**. The consumer inherits W-1 fail-closed behaviour unchanged |
| **Idempotency** | Preserved by reusing `persistBrokerImport` and its `SAVED_NEW_BATCH` / `MERGED_INTO_EXISTING` / `ALREADY_IMPORTED_NO_OP` dispositions. No reimplementation |
| **Auditability** | Preserved by reusing the existing contribution/provenance writes (migration `004`) and `computeBrokerImportProvenance`. No new audit path |
| **Failure reporting** | `BrokerImportRefusal` and `BrokerImportOutcomeUnknown` propagate verbatim to the caller. A refusal or unknown outcome **must never** surface as a successful durable write |
| **Scope** | Non-production, single-user, personal-use. No production admission |
| **Out of scope** | Any change to `evaluatePortSaveGuard`, to the Gate E W-1 conjunction, to `BASIS_COMMIT`/`BASIS_TREE`, to any designated blob, to any gate status, and to IRR |

## 6. Acceptance criteria proposed for the decision

The decision should name, explicitly and separately:

1. **A-1 Consumer reaches the port.** The production flow invokes `persistBrokerImport` with a
   `DurablePortfolioStorePort`, evidenced by a test that fails if the writer is a bare store.
2. **A-2 Refusal is truthful.** With the gate unmet, the consumer returns `WRITE_NOT_AUTHORIZED` /
   `storeEffect: 'NONE'` and creates no row. (Already proven at §4.1 — re-assert at the consumer layer.)
3. **A-3 Durable write on admission.** Only once W-1(3) and W-1(4) are satisfied by rendered acts: a valid
   import persists, survives a **process** restart, and reads back identically.
4. **A-4 Idempotency and replay.** A repeated import yields `ALREADY_IMPORTED_NO_OP` or
   `MERGED_INTO_EXISTING` per the existing policy, with no duplicate contribution rows.
5. **A-5 Fail-closed completeness.** Malformed, unauthorized, refused-identity and duplicate imports
   cannot be misreported as successful durable writes.
6. **A-6 Audit.** Contribution/provenance records are written per migration `004`, with the lineage digest
   bound to the originating broker file.
7. **A-7 Boundary integrity.** Existing IPC/API and repository boundaries remain enforced; the existing
   `12`-fence matrix is unchanged.
8. **A-8 No regression.** The full suite, typecheck and build remain green, and no unrelated capability
   changes disposition.
9. **A-9 Runtime qualification.** `QE-4`, `QE-5`, `QE-6` executed and recorded on the designated host —
   **host-owned; not satisfiable in an agent environment.**
10. **A-10 Acceptance.** A separate Gate 4 result-acceptance act, then a Gate 5 admission act naming the
    qualified commits, boundaries, fence state and evidence.

Criteria **A-3**, **A-9** and **A-10** cannot be met before S1 is unblocked. Criteria A-1, A-2, A-4–A-8 are
implementation-and-test criteria that could be met inside the non-production scope **once state 3 is
authorized**.

## 7. Why the implementation step was stopped

The consumer implementation was **not performed**, for three independent reasons, each sufficient:

1. **State 3 is false and only a rendered act can change it.** `evaluatePortSaveGuard()` is hard-false by
   design. A consumer wired today would refuse every write. That is correct behaviour, but it means the
   consumer cannot demonstrate that *"the intended application flow actually reaches the durable
   persistence operation"* — the explicit requirement, and the explicit prohibition against creating a
   consumer merely to move an import count.
2. **The chain is stopped at S1 by a value no agent may select.** The Gate 4 act states this in terms:
   *"The chain is currently stopped at S1 by a value that no agent may select. This act cannot and does
   not work around it."* Selecting it, or treating it as selected, is outside agent authority.
3. **S6 dispositions are `NOT GRANTED — separate acts`.** Admission follows acceptance follows execution.
   Implementing ahead of the decision would invert that order and would constitute treating technical
   implementation as admission — expressly prohibited.

**This is an authority boundary, not a technical blocker.** The code needed is small and the contracts
already exist. What is missing is the decision.

## 8. Risks

| Risk | Assessment | Mitigation |
|---|---|---|
| A consumer is wired and read as progress | **High** if state 2 is closed without state 3 | The five-state separation at §2; row 28 must not be marked complete |
| A refusal is misread as a durable write | Low — already tested | A-2, A-5 |
| The bare store is used to bypass the gate | **High** if implemented carelessly | A-1 requires the writer to be the port; the §4.2 fixture pattern must not leak into production code |
| Admission is inferred from green CI | Medium | §4.3 and the Gate 4 act's tiering: automated tests ≠ runtime qualification ≠ acceptance |
| `O-05`'s wrong identifier propagates | Medium | §3 corrects it in the IPD locus; the IRR-side correction is a **separate IRR work item** (§10) |

## 9. Dependencies

```
S1  Gate A' provisioning (P-1)            <- PA-designated value; NOT AUTHORIZED; no agent may select it
S2  Limb A merge + native-Windows npm test <- AUTHORIZED - NOT STARTED
S2a H-12 regeneration + express PA adoption<- NOT ADOPTED
S3  Host/runtime preflight                 <- BLOCKED until S1, S2a
S4  QE-1..QE-11 (incl. QE-4, QE-5, QE-6)   <- BLOCKED until S3; 0/11
S6a Gate 4 result-acceptance act           <- NOT RENDERED  (Program Authority)
S6b Gate 5 admission act (CV-52)           <- NOT INITIATED (Program Authority)
      -> satisfies W-1(3) and W-1(4)
      -> state 3 becomes true
      -> consumer implementation becomes meaningful and A-3/A-9/A-10 become reachable
```

**Critical path:** S1 → S2 → S2a → S3 → S4 → S6a → S6b. The consumer implementation is *parallel-capable*
against A-1, A-2 and A-4–A-8 only if the Program Authority expressly authorizes wiring ahead of S6b; that
authorization is **not** requested here and does **not** exist.

## 10. IRR-owned follow-up (separate work item — **not** performed in this pass)

IRR was **read-only** in this pass and was not written. The following IRR-side corrections are required
and are recorded here as a described work item with its exact dependency, per the repository-boundary rule:

| IRR item | Change needed | Dependency |
|---|---|---|
| IRR tracker §16.150.5 `O-05` row | Replace the boundary "`GOV-03`/`BI-08` admission act" with the correct instruments: **Gate 4 result-acceptance act + Gate 5 admission act (`CV-52`)**, with S1 as the structural blocker | This packet, once published |
| IRR tracker §16.81.6 act 2 | Update *"Make the Gate 4 qualification authority act effective … `PROPOSED — NOT EFFECTIVE`"* → **RENDERED / EFFECTIVE** as `IIPS-V3-G4-TARGET-HOST-QUALIFICATION-AUTHORITY-ACT-2026-10-23-01` | Same |
| Capability-matrix row 28 | Update the `Authority` cell (currently cites `GOV-03`/BI-08 governance) and the `Evidence Anchor` to cite this packet and the corrected instruments. **The workbook is IRR-owned**; IPD must not edit it | Same; owner **IRR** |

## 11. Non-grants

No Program Authority decision, approval, signature or designation. No admission, acceptance, qualification
or release decision. No execution pin or blob re-designation. No `BASIS_COMMIT` / `BASIS_TREE` change. No
provisioning execution, no P-1, no capture, no host preflight, no PowerShell, no store probe. No Gate 4
QE execution, no S3, no Gate 5, no DQ-4 movement. No write to IRR. No change to
`evaluatePortSaveGuard`, to the W-1 conjunction, or to any fence.

**P-1-C NOT ESTABLISHED. P-1-D DESIGNATED, NOT VERIFIED FOR THE ATTEMPT. P-1 NOT EXECUTED / UNSPENT /
NOT AUTHORIZED.**

## 12. Verification register

| ID | Check | Evidence | Result |
|---|---|---|---|
| `V-R28-01` | Live remote basis read before any write | `gh api …/branches/main` → `b9dd6fce48fafba8ca6095debefb62fd54234f85`, tree `34ee1a3b97b787a4bdbc6d27943c6c4cfb1f6f6f`; open PRs `0` | **PASS** |
| `V-R28-02` | Zero production consumers at head | `git grep -l 'durablePortfolioStorePort'` / `'brokerImportPersistence'` under `src/`, `scripts/` → **none**; under `tests/` → `g3_durability_vocabulary.test.ts`, `q1_broker_import_durability.test.ts` | **PASS** |
| `V-R28-03` | Write gate is hard-false and unconditional | `src/persistence/portfolio_store.ts:213-217`; comment states no flag, test result or operator assertion changes it | **PASS** |
| `V-R28-04` | Port refusal behaviour executed | `tests/q1_broker_import_durability.test.ts` *"the W-1 write gate refuses the import with zero store effect"* — `WRITE_NOT_AUTHORIZED`, `storeEffect NONE`, row count unchanged, refusal before callback and before transaction | **PASS** |
| `V-R28-05` | Durable path proven on a bare-store fixture, incl. separate-process restart | same file, *"the durable import on a qualification fixture"* — 10 cases | **PASS** (component evidence only) |
| `V-R28-06` | `GOV-03` is an implementation item, not an admission act | IRR tracker §16.81.6: *"GOV-03 is NOT complete … Implementation authority is not qualification authority"* | **PASS** |
| `V-R28-07` | `BI-08` is the idempotency contract, not an admission act | `docs/FULL_IIPS_BI08_CONVERGENCE_PLAN.md` §11; `tests/bi08_idempotent_ingress.test.ts` | **PASS** |
| `V-R28-08` | Gate 4 authority act is effective; execution and acceptance are not | `IIPS_V3_CAP02_GATE4_TARGET_HOST_QUALIFICATION_ACT_EFFECTIVE_2026-10-23.md` §6 (S0 DONE; S1 BLOCKED; S4 BLOCKED; S6 NOT GRANTED) | **PASS** |
| `V-R28-09` | Baseline re-executed at head | `npm ci` exit `0`; `npx tsc` exit `0`; `npm test` → **932 tests / 124 suites / 931 pass / 0 fail / 1 skipped**, `[test-guard] OK`, exit `0`; `npm run test:package-consumer` `PASS`, browser pack `1,729,910` B, `forbiddenHits: []`, strict typecheck `PASS`, exit `0` | **PASS** |
| `V-R28-10` | No implementation, wiring, provisioning or gate change occurred in this pass | `git diff` limited to this packet and the IPD execution-tracker append | **PASS** |
| `V-R28-11` | No write to IRR | IRR read-only; no IRR commit, branch, PR or file change in this pass | **PASS** |

*End of packet. **PROPOSED — NOT EFFECTIVE.** No admission granted, no gate moved, no fence lifted, no
write enabled, nothing provisioned. `P-1` remains **UNSPENT**.*
