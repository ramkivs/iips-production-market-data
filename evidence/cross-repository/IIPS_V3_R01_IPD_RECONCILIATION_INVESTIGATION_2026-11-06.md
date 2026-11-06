# IIPS V3 — R01 IPD residual UNKNOWN/lost-ack reconciliation: investigation and disposition (2026-11-06)

**Status:** Investigation and publication record. **READ-ONLY: no source, test, schema, configuration, CI or workflow file is modified by this document or by this work item.** No operational database is accessed; no operational writes are performed; W-1 remains hard-false; no QE item, Gate 4, Gate 5/CV-52, D06 or admission action is taken or authorized. The standing instruction withholding further IPD implementation remains effective; nothing in this report authorizes implementation.

**Scope:** the single outstanding prerequisite **R01** identified in the prerequisite-closure report published by IRR PR #491. No other prerequisite, deviation, repository, contract or operational surface is addressed.

- Investigating repository / branch: `ramkivs/iips-production-market-data`, branch `arena/05376739-iips-production-market-data`
- Content baseline of this investigation: IPD `origin/main` = `f9dac560b821476c417b963c83c80ad0e7747dc7` (merge of PR #130, merged 2026-11-06T13:39:31Z, parents `1cde2324…` + `9f33937c…`). This is the same commit the working tree of this branch pins at the time of writing.
- Authoritative R01 source: IRR (`ramkivs/iips-review-recovered`) `main` = `e482cda4ae7add8f94db041048a172f9941475c9` (merge of IRR PR #491, merged 2026-11-06T13:51:24Z).

---

## 1. Executive summary

1. R01 is a **confirmed residual implementation deviation** — specifically an under-correction of the deviation-2 work merged via IPD PR #130. The merged reconciliation path (`reconcileSnapshotV2ByRead` et al.) is **not** a conforming implementation of the effective D03 exact-settled-readback rule (DURABLE-HOLDINGS SPEC v1 §3.3) for the `COMMITTED_VERIFIED` branch, and its dual-pass consistency check is **verdict-string equality, not evidence-snapshot equality**.
2. R01 is **not**: an evidence-only gap; a pure contract-interpretation question; or already resolved by subsequent changes. It is also **not** an executed operational failure — all corroborating evidence is static review of source at `f9dac560…`, plus synthetic-fixture tests.
3. The **minimum conforming correction** (§6) is a logic-only change inside the already-effective **D05** bounded implementation envelope (§8) plus conservative negative regression tests (§7). It requires **no new schema, no new wire operation, no migration, no IRR runtime/pin change, no new lock/fsync behaviour**.
4. If (and only if) the chosen mechanism steps outside the D05 named file/test envelope (new wire operation, schema, pin, semantic or operational mechanism), that exact delta requires a **separate exact PA disposition before execution**. The report in §6 is designed to fit the envelope; fit must be re-verified by the executing IPD session before the first edit, per the ACT's own instruction to the responsible IPD session.
5. **The IPD implementation suspension is not lifted by this publication.** Next executable action sits with the PA: render (or decline) a bounded R01 implementation instruction scoped to D05; only after that does IPD execute. IRR EO/tracker updates, if any are warranted after execution, are a separate IRR task and are not appended here.

## 2. The R01 requirement as published (exact source)

**Publication vehicle.** IRR PR **#491** — `Pre-QE prerequisite closure: IPD130 evidence, bounded closures, exact remaining blockers` — **MERGED 2026-11-06T13:51:24Z**, merge commit `e482cda4ae7add8f94db041048a172f9941475c9`. Merge content = IRR `main` at the time of this investigation.

**Authoritative document** (verbatim R01 text reproduced in Appendix A): `docs/integration/PRE-QE-PREREQUISITE-CLOSURE-REPORT-2026-11-06.md` (blob `cf29d886e5f3808a78757ad6d987c6eef2df4201`, 29,962 bytes), §3, item heading:

> `R01 — UNKNOWN/lost-ack reconciliation: PARTIAL CORRECTION; residual BLOCKED (IPD owner)`

**Published residuals at `f9dac560…` (source-proven):**

1. `portfolio_store.ts:791–805` acquires `BEGIN IMMEDIATE` and immediately `ROLLBACK`s. It proves no competing writer holds the lock at that instant — not terminal completion/cancellation of a particular lost-ack operation. A queued/not-yet-writing operation can still proceed after lock release. **The lock is not held through the reconciliation reads.**
2. `brokerImportPersistence.ts:703–726` keeps an optional successor and a ledger-only terminal result at 713–716. With successor, checks validate shapes/existence independently. `contributionCorrespondent` at 676–683 and `revisionCorrespondent` at 693–700 do **not** compare contribution lineage to that revision's provenance, bind the revision to the intended import's expected evidence, or read/match actual holdings.
3. Lines 773–776 compare **verdict strings**, not identical evidence snapshots. Different row evidence can produce `COMMITTED` on both passes; equal verdicts are not consistent-read proof.
4. **V2-R06** (`tests/durable_holdings_recovery_v1.test.ts:619–750`) covers throwing probe, malformed/empty/non-MERGE provenance, null lineage and a changed verdict. It does **not** establish operation-specific terminal settlement, same-verdict/different-evidence handling, cross-lineage mismatch or exact holdings comparison. The actual cases were not executed in this commission.

**Published required next action (verbatim):**

> IPD perform a narrow residual conformance correction and negative tests for those gaps, using the already-effective D03 exact-settled-readback rule (SPEC§3.3). Missing proof must remain UNRESOLVED; no retry. Preserve existing #130 improvements, cap4/v1/W1. Completion requires operation-specific terminal proof or conservative unresolved behavior, consistent exact revision/contribution/provenance/actual-snapshot correspondence and targeted regression/publication evidence. A new broad lock/fsync guarantee is neither required nor authorized.

**Published authority line (verbatim):**

> existing D05 may support exact bounded IPD source/test remediation in its named envelope; routine conforming work does not require re-adopting D03. The responsible IPD session must check the proposed mechanism fits that envelope. New wire operations, IRR runtime/pin changes, schema/semantic expansion or operational mechanism would require a separate exact PA disposition. This IRR task neither changes IPD nor executes its tests. Current evidence is static review, not an executed operational failure.

**Companion references in the same IRR `main`:** `IIPS_V3_E2E_MASTER_TRACKER_AND_IRR_IPD_DECISION_REGISTER_2026-10-13.md` (blob `0e01501a…`, the append-only register; §16.268 / CV-248 cited by the PR body); tracker row / H06 / H10 and QE10 pointers to R01; §4 of the report assigns **IPD owner** and marks R01 as the **next executable engineering item** explicitly under D03/D05 at the named envelope.

## 3. Governing requirement and authority

### 3.1 The contract rule — DURABLE-HOLDINGS SPEC v1.0 `docs/integration/DURABLE-HOLDINGS-CONTRACT-AND-QUALIFICATION-SPEC-v1-2026-11-06.md` (published #476; blob `38c435995fe4b3d9e434ec02432c59f944c49a7a`, 48,180 bytes; SHA-256 `4f478ebd8158c0032b1041afca9cfae5e9dec7036eed067b8169cf6697e7ee40`)

§3.3 *Outcome and recovery state machines* (the rule R01 is alleged against), load-bearing rows, verbatim:

> | Any attempted write + timeout/disconnect/commit uncertainty | OUTCOME_UNKNOWN | Neither SAVED nor FAILED-to-retry; no automatic resend |

> | OUTCOME_UNKNOWN + exact authorized revision/contribution readback | COMMITTED_VERIFIED or still UNRESOLVED | **Match stable ID, expected successor/current revision, content/contribution/provenance evidence and actual snapshot; a receipt alone is insufficient** |

> | OUTCOME_UNKNOWN + absent row | UNRESOLVED unless terminal non-commit proved | **Absence while a writer could still commit is not proof; require settled operation/quiescence and consistent reads before NOT_COMMITTED classification** |

Two implications: (i) a `COMMITTED` verdict requires **all four** of: stable ID (outcome binding), expected successor/current revision binding, content/contribution/provenance correspondence, **actual snapshot** correspondence — a receipt or two equal verdicts are expressly insufficient; (ii) `NOT_COMMITTED` requires the settled-quiescence precondition **plus** consistent reads, and never while a writer could still commit.

§3.1 line 69 (context for R02/F3, cited only to bound R01) requires timestamp/reference correspondence with an approved retained IRR record and forbids inventing DB keys; §3.4 defines the ten-field contribution shape with **no** `evidenceRecordDigest` field — i.e., the correction may rely on existing columns only and must not invent persisted keys.

### 3.2 Adopted contract D03 — `IIPS-V3-G2-SNAPSHOT-CONTRACT-V2-2026-11-06-01` (ADOPTED / EFFECTIVE 2026-11-06)

`docs/integration/IIPS_v3.0_PA_D02_D03_D05_ENGINEERING_ACT_2026-11-06.md` (blob `cea7fed5618ed08683cf9d12d22b0a6e02c557f4`, 7,532 bytes; Act ID `IIPS-V3-PA-D02-D03-D05-ENGINEERING-2026-11-06-01`; effectiveness discharged by IRR #477 publication + receipt `issuecomment-6676618817`; head `423d8dd2…` CI `42160555831`, main CI `42160653145` SUCCESS). The operative D03 decisions, verbatim-critical fragments:

> Adopt consumer contract 2.0.0/frame v=2 as specified, with current override **cap=4**, duplicate-before-cap/no-op semantics and v1 preservation. Complete observed snapshots … Stale revision first; duplicate at current revision returns original revision/lineage without writes even at cap; new mutation at cap refuses. No automatic retry; requestId correlation only; **timeout/uncertain acknowledgement remains UNKNOWN until exact authorized readback**.

No automatic retry anywhere; UNKNOWN persists until exact authorized readback — exactly the branch R01 scrutinizes.

### 3.3 Bounded implementation authority D05 — `IIPS-V3-G2-BOUNDED-SNAPSHOT-ENGINEERING-2026-11-06-01` (ADOPTED / EFFECTIVE 2026-11-06)

The operative D05 decision, with the file envelope and exclusions that bound any R01 correction:

> File envelope: `src/ipc/protocol.ts`, `src/ipc/dispatch.ts`, `src/persistence/binding.ts`, `src/persistence/portfolio_store.ts`, `src/persistence/brokerImportPersistence.ts`; new isolated tests `tests/durable_holdings_contract_v1.test.ts`, `tests/durable_holdings_recovery_v1.test.ts`, targeted documentation/evidence. Reuse existing runtime/connection/migrations/security-master/guard unchanged. Schema/migration DESIGN and testing in disposable environments permitted, no operational provisioning or migration and no prior migration rewrite. IRR changes are authority/tracker/evidence documentation ONLY.

> All live write paths MUST remain hard-false/refused… No new live raw-store path. Production dispatch may expose v2 read/refusal behavior only, while mutation algorithms are exercised in isolated fixtures under this act.

Exclusions binding R01 (§3 of the Act): no operational/live holdings writes; no operational DB access/modification; no operational inventory/provisioning/migration; no production activation; **no D06 operation admission, no Gate 4 acceptance/content, QE execution (remains 0/11)**; retention/owner-clearing/PF-1/frozen-control changes; accounting-scope expansion; no multiuser/tenant expansion; guard/owner-isolation relaxation. **No guessing of identities; no synthetic-real conflation.**

### 3.4 Standing restrictions restated for this work item

- The explicit instruction withholding further IPD implementation is effective; this publication does not lift it.
- W-1 remains hard-false; all four product IPC writes return `WRITE_NOT_AUTHORIZED` before any store mutation (v1 and v2).
- Four-revision cap in force; duplicate checked before cap; stale first; v1 parsing/results/refusals byte-compatible; v2 explicitly separate.
- No contract or receipt-schema modification; SPEC is not amended by anything here; no `durable:true` claim.

## 4. Source inventory and finding verification at authoritative `origin/main` (`f9dac560…`)

Citations below were verified line-by-line against `f9dac560…` (content identical to the merge-commit tree; the pre-merge main was identical in these regions). Blob SHAs (git): `src/persistence/portfolio_store.ts` → `5c12c384…`; `src/persistence/brokerImportPersistence.ts` → `49f5ecb3…`; `tests/durable_holdings_recovery_v1.test.ts` → `71b44db9…`; `tests/durable_holdings_contract_v1.test.ts` → `10926732…`; `src/persistence/durablePortfolioStorePort.ts` → `d95608d9…`.

### 4.1 F1 — Settlement probe is instantaneous and not operation-bound  ⇢  published residual (1)

`src/persistence/portfolio_store.ts` — `proveSettledForReconciliation()` at **lines 785–805** (doc comment 772–790):

```ts
proveSettledForReconciliation(): void {
  if (this.transactionDepth > 0) { throw new Error('settlement cannot be proven inside an open transaction'); }
  this.db.exec('BEGIN IMMEDIATE;');
  try { this.db.exec('ROLLBACK;'); } catch (error) { … }
}
```

Verified properties: (i) zero writes — but only an **instantaneous** quiescence signal: it certifies that no writer holds the write lock **at the moment of the probe**; (ii) **the lock is not held through the reconciliation reads** (`readReconciliationPass` runs afterwards, outside any lock); (iii) the probe binds to **no particular operation** — it cannot distinguish “the lost-ack transaction committed atomically” from “some other writer quiesced”, nor can it rule out a queued-but-not-yet-locking lost-ack writer proceeding between the probe and the reads or between the two read passes; (iv) its own doc comment concedes the meaning (“no writer holds the write lock at this instant”) but the enclosing docstring in `reconcileSnapshotV2ByRead` **overstates** it as “settlement is proven” — an unqualified claim SPEC §3.3 does not license.

Assessment: sufficient as a **necessary** precondition for any `NOT_COMMITTED`-by-absence verdict; insufficient as evidence of **operation-specific terminal settlement** and never sufficient on its own for any verdict. Requirement (b) of SPEC §3.3 (settled operation/quiescence) is met only in the weak, instantaneous sense; requirement (a) (stable operation binding) is absent.

### 4.2 F2 — Correspondence checks are shape-only; ledger-only `COMMITTED` is reachable  ⇢  published residual (2)

`src/persistence/brokerImportPersistence.ts`:

- `contributionCorrespondent(row, contentDigest)` (**676–684**): requires `contributionId === contentDigest`, stored `contentDigest` copy equal, `lineageDigest` 64-hex, non-blank `fileName`/`sourceBroker`, UTC-ISO `importedAt`. **It does not**: compare `lineageDigest` to the successor revision’s stored `provenance_digest`; require `contentDigest` equality to the intended request’s digest beyond the identity copy; verify `fileName`/`sourceBroker`/`importedAt` against the intended operation; or read any holdings row.
- `revisionCorrespondent(row)` (**693–704**): requires existence, `operation === 'MERGE'`, safe-integer `holdingsCount >= 1`, finite `totalMarketValue >= 0`, non-blank `committedAt`, 64-hex `provenanceDigest`. **It does not**: read the revision’s stored `content_digest` column at all (the column exists; the `RevisionEntry` §6 projection deliberately omits it and even the internal read path never compares it); compare `provenanceDigest` to the contribution’s `lineageDigest`; bind `committedAt`/revision number to the intended operation’s expected successor (beyond the caller-supplied number); or read/match actual holdings.
- `readReconciliationPass` (**703–729**): with `expectedSuccessorRevision === undefined`, returns a **ledger-only verdict** — `COMMITTED` at **line 714–716** from the ledger row alone (match + correspondent) with **no** revision-history cross-check and **no** actual-snapshot read. With successor supplied (725–727), the check is `match && contributionCorrespondent && revisionCorrespondent` — three independent shape predicates; **no cross-predicate equality is ever enforced between the contribution and the revision, and no holdings row is ever read.**
- `reconcileSnapshotV2ByRead(writer, owner, portfolioId, contentDigest, expectedSuccessorRevision?)` (**750–779**): `expectedSuccessorRevision` is **optional** at the type level — the insufficiency above is therefore reachable through the public signature, not merely theoretical. The docstring "(1) settlement is proven by … a lost-acknowledgement writer either committed atomically before the lock was granted or is blocked behind it, so absence is never read while a writer could still commit" repeats the instantaneous-probe overstatement of F1.

### 4.3 F3 — Dual passes compare verdicts, not evidence  ⇢  published residual (3)

`reconcileSnapshotV2ByRead` (**750–779**), the load-bearing lines **773–777**:

```ts
const first  = readReconciliationPass(writer, owner, portfolioId, contentDigest, expectedSuccessorRevision);
const second = readReconciliationPass(writer, owner, portfolioId, contentDigest, expectedSuccessorRevision);
if (first !== second) return 'UNRESOLVED';
return first;
```

`readReconciliationPass` returns only one of `'COMMITTED' | 'NOT_COMMITTED' | 'UNRESOLVED'`. Two passes may both return `COMMITTED` over **different row evidence** (e.g., a between-pass re-write that succeeds atomically with new values, or a foreign row that independently satisfies the three shape predicates on both passes) and yet satisfy this equality. SPEC §3.3 requires "**consistent reads**" — identical evidence, not identical verdict strings. No row content is hashed or compared anywhere in the two passes.

### 4.4 F4 — Regression coverage absent for the residual cases  ⇢  published residual (4)

`tests/durable_holdings_recovery_v1.test.ts` V2-R06 (**619–752**) — verified cases: probe-throw (absent and present); absent+settled → `NOT_COMMITTED` (ledger-only); settled exact correspondence → `COMMITTED` with zero writes; **flickering contribution row** (PASS1 match, PASS2 absent) → `UNRESOLVED`; empty successor snapshot → `UNRESOLVED`; non-MERGE successor → `UNRESOLVED`; malformed successor provenance → `UNRESOLVED`; legacy/NULL lineage against a real store → `UNRESOLVED`; malformed digest / `expectedSuccessorRevision < 2` → `UNRESOLVED`; `domainCounts` unchanged throughout.

**Verified absent (exactly the published gaps):**
- operation-specific terminal settlement proof, or conservative unresolved behavior tied to it;
- **same-verdict/different-evidence** across passes (e.g., `totalMarketValue` changing between passes while both verdicts read `COMMITTED`);
- **cross-lineage mismatch** — contribution `lineageDigest` ≠ successor `provenanceDigest`, or contribution `contentDigest` ≠ successor stored `content_digest`;
- **exact holdings/actual-snapshot comparison** — both its positive (`COMMITTED` only with full snapshot equality) and negative (one perturbed row) cases;
- successor-argument-omission case exercising the ledger-only `COMMITTED` branch (F2/line 716) with the expectation that `COMMITTED` is **not** earned;
- expected revision belongs to foreign/tombstoned/other-owner evidence → `UNRESOLVED`.

Related coverage that exists and must be preserved: V2-R02 (commit-ack loss → UNKNOWN → readback; **343–424**), V2-R03 (separate-process exit; **427–470**), the V1-path ack-loss case in `tests/q1_broker_import_durability.test.ts` (**397–408**), and the zero-write assertions. No test currently executes or cites a complete `COMMITTED_VERIFIED` under full §3.3 correspondence because that correspondence does not yet exist in code.

### 4.5 Adjacent observation, out of R01 scope (recorded, not remediated)

`reconcileBrokerImportByRead` (**348–357**) — the simpler v1 broker-import reconciler — is also ledger-presence-only (`COMMITTED` iff a contribution row matches `contentDigest`, else `NOT_COMMITTED`, read errors → `UNRESOLVED`), with no settlement probe, no successor binding and no history cross-check. It predates D02/D03/D05, lives outside the v2 read surface, and **R01 does not direct changes to it**. If its equivalence class is ever to be reconciled, that is a separate scope decision requiring its own authority check; mixing it into the R01 correction would silently broaden the work and is forbidden here. It is flagged for the PA, nothing more.

### 4.6 Notes on the #130 evidence publication

`evidence/cross-repository/IIPS_V3_D02_D03_D05_PR129_DEVIATION_CORRECTIONS_2026-11-06.md` §3/§6 records Deviation 2 as "**(corrected)**" and describes the settlement probe as establishing quiescence. That disposition is accurate for what was built (probe, shape correspondences, zero-write property, V2-R06 suite) but **materially incomplete as a conformance claim**: it does not and cannot evidence §3.3's content/contribution/provenance/**actual-snapshot** correspondence, cross-predicate binding, or evidence-snapshot consistency, because the code does not implement them. This investigation **qualifies** — it does not strike — that publication; when the correction lands, the evidence note must carry a scoped correction annotation referencing this investigation (targeted edit, historical record preserved, no rewriting).

## 5. Disposition

| Candidate classification | Determination | Basis |
|---|---|---|
| Evidence / documentation gap | **No** | A documentation annotation cannot create the missing code correspondence; §3.3’s `COMMITTED_VERIFIED` branch is unreachable in conforming form today. (The mislabel in the #130 evidence note — §4.6 — is a real documentation defect, but curing it without code would leave a false conformance claim.) |
| Contract-interpretation issue | **No** | §3.3 is textually unambiguous (four-part match for `COMMITTED_VERIFIED`; quiescence + consistent reads before `NOT_COMMITTED`). The failure is not disagreement about meaning but absence of the required mechanisms and tests. |
| Already resolved by subsequent changes | **No** | `f9dac560…` is the newest `main`; IRR PR #491 post-dates it and codifies the residuals. Nothing later modifies these paths. |
| **Confirmed implementation deviation (under-correction)** | **YES** | F1–F4 against §3.3 (§3.1 of this report). Specifically: the `COMMITTED` verdict is reachable on (i) instantaneous, non-operation-bound quiescence, (ii) shape-only, cross-unbound correspondences, (iii) verdict-string rather than evidence equality; and the regression suite omits the controlling negative cases. `UNRESOLVED`/`NOT_COMMITTED` defaults are broadly conservative, but conservatism that is **optional** (successor argument may be omitted; ledger-only COMMITTED exists) is not the §3.3 guarantee. |
| Severity note | — | Not an executed operational failure; synthetic fixtures only; W-1 false; the product never reaches these developer-disposed surfaces through IPC dispatch for writes. Impact is conformance debt in a pre-admission regime (QE 0/11): fix before any qualification/admission witnessing, never as a qualification shortcut. |

**Overall R01 disposition: OPEN — confirmed residual implementation deviation.** The #148/#130 partial correction stands as published; R01 remains the residual to close it, precisely as the IRR report classifies it.

## 6. Minimum conforming correction (proposed mechanism — not executed; no authorization here)

All steps are read/compare logic over **existing columns**; nothing here persists a new key, migrates a table, adds a wire operation, or weakens a guard. Executed only after the PA lifts the implementation suspension scoped to this envelope.

- **P1 — Make the successor binding mandatory for any `COMMITTED` at the v2 boundary.** `reconcileSnapshotV2ByRead` must require `expectedSuccessorRevision` for a `COMMITTED` verdict. When omitted: ledger match present → `UNRESOLVED` (never `COMMITTED`); proven absence (settled quiescence + both read passes observe empty ledger **and** empty history for the expected-revision window) may remain `NOT_COMMITTED`. The signature keeps the argument required or split into two functions; the outcome set is unchanged (`COMMITTED | NOT_COMMITTED | UNRESOLVED`).
- **P2 — Bind the successor revision to the intended operation’s content evidence.** The internal read path for reconciliation (not the §6 wire projection) must also select stored `portfolio_revisions.content_digest`. `COMMITTED` requires `successor.content_digest === contentDigest` (the request’s digest of the intended import content) **in addition to** existing shape checks. (The v1 `portfolio_revisions.content_digest` column exists in migration 001; no data change.)
- **P3 — Cross-bind contribution and revision to each other and to the request.** `COMMITTED` requires all of: contribution `lineageDigest === successor.provenanceDigest`; contribution `contentDigest === successor.content_digest`; and `successor.provenanceDigest` equals the provenance digest recomputed from the **request** being reconciled (recompute via the existing deterministic `computeBrokerImportProvenance`-equivalent mapping over the resolved intended holdings — pure function, no I/O). Any mismatch → `UNRESOLVED`.
- **P4 — Bind the actual snapshot.** Read the successor revision’s holdings rows and compare them against the intended mapped holdings (symbol, quantity, average/current price, market value, weight, active, sourceBroker, lineage, identity fields) using the existing canonical ordering; equality required → else `UNRESOLVED`. A 001–003-upgraded store or a legacy row missing the required fields → `UNRESOLVED`.
- **P5 — Evidence-consistent dual passes.** Serialize a snapshot fingerprint `(revision tuple [revision, operation, committedAt, totalMarketValue, weightSum?, holdingsCount, provenanceDigest, contentDigest], contribution tuple [all ten fields], actual-snapshot fingerprint from P4)` and require **deep equality** across pass 1 and pass 2 — not equal enum verdicts. Any difference → `UNRESOLVED`. This is the exact meaning of §3.3’s “consistent reads”.
- **P6 — Settlement stays necessary, never sufficient, and honest.** `proveSettledForReconciliation()` remains the absence-side precondition (zero writes, throws → `UNRESOLVED`); its documentation is narrowed to “instantaneous quiescence certificate — necessary precondition for NOT_COMMITTED, never evidence of the operation’s outcome”. No lock is held through the reads (none is authorized); no retry, no timer, no background reconciliation; no change to dispatch, cap, duplicate ordering or W-1.
- **P7 — Outcome floor remains conservative.** Any failure, mismatch, absence of proof or unreadable evidence → `UNRESOLVED`. `NOT_COMMITTED` only under P1’s tightened absence conjunction. Zero writes by the reconciler asserted and kept (`domainCounts` unchanged per fixture). `expectedSuccessorRevision` < 2 stays rejected; v1 wire names unchanged; v1 surface (`reconcileBrokerImportByRead`, §4.5) untouched.
- **P8 — Evidence correction (targeted).** The #130 evidence note §3/§6 gains a one-paragraph correction annotation referencing this investigation and the correcting PR; historical text is preserved verbatim with a correction marker, per this repository’s append-only evidence convention.

The correction therefore lands entirely inside the D05-named file envelope (persistence source + the two named recovery/contract test files + targeted evidence). If P2–P4 as written cannot avoid touching `src/ipc/protocol.ts`/`dispatch.ts`, `binding.ts`, migrations, the wire projection, or any consumer — **stop and request exact PA disposition** instead of broadening silently.

## 7. Required negative regression tests (to accompany the correction)

All extend `tests/durable_holdings_recovery_v1.test.ts` (fixture-class, synthetic disposable databases, zero product-path enablement); none require new dependencies:

| ID | Case | Expected |
|---|---|---|
| R01-T1 | Two read passes agree on verdict `COMMITTED` but row evidence differs (e.g., `totalMarketValue` differs between passes) | `UNRESOLVED` |
| R01-T2 | Contribution `lineageDigest` ≠ successor `provenanceDigest` (both well-formed) | `UNRESOLVED` |
| R01-T3 | Successor `content_digest` ≠ request/intended `contentDigest` | `UNRESOLVED` |
| R01-T4 | Stored successor holdings differ from intended snapshot in exactly one row (value or identity field) | `UNRESOLVED`; exact-match control stays `COMMITTED` (positive) |
| R01-T5 | Ledger `COMMITTED`-shaped match with **no** `expectedSuccessorRevision` supplied | `UNRESOLVED` (not `COMMITTED`) |
| R01-T6 | Setphone successor at expected number but evidence belongs to a different/foreign import (or different portfolio/owner) | `UNRESOLVED` |
| R01-T7 | Successor present for a *different* revision number with matching shapes everywhere | `UNRESOLVED` |
| R01-T8 | Settlement probe fails → verdict `UNRESOLVED` even when all reads would succeed (existing V2-R06 §b — keep) | `UNRESOLVED` |
| R01-T9 | Reconciliation performs zero writes across all above (domainCounts equal before/after — keep existing assertion pattern) | unchanged |
| R01-T10 | Commit-ack-loss → `UNKNOWN` → reconcile `COMMITTED` → re-import same file → `ALREADY_IMPORTED_NO_OP`; ledger unchanged (guards no-retry + duplicate-before-cap) | unchanged counts; no retry |
| R01-T11 | Legacy/NULL provenance on a matching contribution row against a real store (existing i) and on a matching (would-be T2) pair (existing h) — keep as-is | `UNRESOLVED` |
| R01-T12 | 001–003 upgraded store lacking snapshot evidence → CONSERVATIVE `UNRESOLVED`, never `COMMITTED` | `UNRESOLVED` |

Existing V2-R06 cases remain in force; the suite must stay green (or exceed) at the corrected baseline — expected suite growth: ≥ +8 assertions of the above; `npm test` gate for merge: 0 failures, and the published guarded count will be recorded on the head/main runs. No test may enable a product write path or relax W-1.

## 8. Authority dependencies and ownership

**Ownership.** IPD owner/session — per the IRR PR #491 publication assigning R01 to “IPD owner” (§3.4 of that report: “exact outstanding action; accountable owner; authorization”). The executing IPD session is responsible for the pre-flight envelope-fit check the Act demands (“The responsible IPD session must check the proposed mechanism fits that envelope”).

**Effective authority likely sufficient (re-verify before first edit).** If the correction stays §6/§7-pure — persistence-source logic + named tests + targeted evidence — it is routine conforming work under effective **D05** (`IIPS-V3-G2-BOUNDED-SNAPSHOT-ENGINEERING-2026-11-06-01`, effective 2026-11-06) implementing the effective **D03** exact-settled-readback rule (SPEC v1 §3.3); no re-adoption of D03 is required. Cap=4, duplicate-before-cap, stale-first, v1 byte-compat, W-1 false, and all D05 §3 exclusions stay binding — including *no operational DB access, no provisioning, no QE, no admission, no `durable:true`*.

**Separate exact PA disposition required BEFORE execution if any of the following become true** (any one suffices to leave the envelope): a new IPC/wire operation or frame; any schema, migration or new persisted key (e.g., `evidenceRecordDigest`); any IRR runtime, pin or consumer change (the v1 consumer stays frozen); any semantic expansion of saved-outcome vocabulary; any operational mechanism (locks, fsync, queueing, background settlement); any acceptance/qualification execution or claim.

**Current suspension.** The instruction withholding further IPD implementation is in effect and is not lifted by this report or its publication. “Next executable action” below is the PA’s to authorize; this report renders no authority and no PA decision.

**Unaffected / explicitly unchanged:** IRR v1 consumer runtime and pins; `WRITE_NOT_AUTHORIZED` hard-false conjunction; Gate 4 (`NOT AUTHORIZED` / `NOT STARTED`, QE 0/11); Gate 4 result acceptance; Gate 5/CV-52 (not initiated); D06 (`CONDITIONAL` / not admitted); H-12; retention/owner-clearing; G3/D5-D6 history (reference-only); receipt schemas.

## 9. Sequencing after a PA instruction (not started; listed for completeness)

1. PA instruction lifting the suspension scoped exactly to R01 (P1–P8; named file envelope; synthetic fixtures only; W-1 false; cap4; v1 untouched).
2. IPD implements §§6–7 on a bounded branch; `npx tsc --noEmit`, `npm run build`, guarded `npm test` (record new executed/pass/fail); targeted evidence note P8; PR.
3. Head + merge-to-main CI both green with the guarded count and `executed test count` check published; **independent remote readback** (head/main SHAs, check conclusions, published count); merge (merge commit) per normal governance.
4. IPD publication receipt appended (IRR-evidence mirror) by the PA/IRR owner — a separate IRR work item, not performed or presumed here.
5. R01 closes only on that evidence pair; until then R01 remains OPEN and Gate 4 remains NOT STARTED.

## 10. What this investigation did and did not do

**Did:** read the merged PR #491 authority documents and R01 verbatim via the git/API read paths; audited every cited source region line-by-line at `origin/main` (`f9dac560…`); enumerated the missing cases against V2-R06; drafted the minimum correction and tests; verified citations, paths and identifiers cited above; published this report.

**Did not:** modify any source/test/schema/config/CI/workflow file; apply any patch; execute implementation or tests (only read-only review — current head CI remains the standing evidence for code health); access any operational database; perform or wait on any gate/admission/QE action; edit IRR; close/reopen issues; render or imply any PA decision; claim R01 closed.

## 11. Publication and verification record

- File: `evidence/cross-repository/IIPS_V3_R01_IPD_RECONCILIATION_INVESTIGATION_2026-11-06.md`
- Branch: `arena/05376739-iips-production-market-data` · base: `origin/main` = `f9dac560b821476c417b963c83c80ad0e7747dc7`
- The publication commit of this file is the branch tip at push time; the file's git blob SHA as pushed is recorded in the work item's push receipt (GitHub-side `contents` API readback after push), not self-referenced inside the file.
- Verification performed at publication time: `git diff --check` (no whitespace errors); zero trailing whitespace; zero CR bytes; balanced code fences; every repository path cited in §2/§4/Appendix B confirmed present at `f9dac560…`; every line anchor in §4 re-verified by direct `grep` at authoring time; referenced IRR SHAs (report blob `cf29d886…`, SPEC blob `38c4359…`, ACT blob `cea7fed…`, tracker blob `0e01501a…`) fetched via API directly from IRR `main` to confirm they exist.
- Status after publication: investigation **published**; R01 **remains OPEN**; implementation **not authorized, not started**.

---

## Appendix A — R01 verbatim (from `PRE-QE-PREREQUISITE-CLOSURE-REPORT-2026-11-06.md` §3, IRR `main` @ `e482cda4ae7add8f94db041048a172f9941475c9`, blob `cf29d886…`)

> ### R01 — UNKNOWN/lost-ack reconciliation: PARTIAL CORRECTION; residual BLOCKED (IPD owner)
>
> #130 genuinely adds a probe, stronger provenance shape checks and two read passes, plus V2-R06. These completed substeps and their CI are VERIFIED; do not repeat their implementation as if absent. Its evidence pack labels the deviation corrected. **This IRR assessment cannot mark the whole requirement closed**, for the following source-proven residuals at `f9dac560…`:
>
> 1. `portfolio_store.ts:791–805` acquires BEGIN IMMEDIATE and immediately ROLLBACKs. It proves no competing writer holds the lock at that instant, not terminal completion/cancellation of a particular lost-ack operation. A queued/not-yet-writing operation can still proceed after lock release. The lock is not held through reconciliation reads.
> 2. `brokerImportPersistence.ts:703–726` keeps optional successor and a ledger-only terminal result at713–716. With successor, checks validate shapes/existence independently. `contributionCorrespondent` at676–683 and `revisionCorrespondent` at693–700 do not compare contribution lineage to that revision's provenance, bind the revision to the intended import's expected evidence, or read/match actual holdings.
> 3. Lines773–776 compare verdict strings, not identical evidence snapshots. Different row evidence can produce COMMITTED on both passes; equal verdicts are not consistent-read proof.
> 4. V2-R06 (`tests/durable_holdings_recovery_v1.test.ts:619–750`) covers throwing probe, malformed/empty/non-MERGE provenance, null lineage and a changed verdict. It does not establish operation-specific terminal settlement, same-verdict/different-evidence handling, cross-lineage mismatch or exact holdings comparison. The actual cases were not executed in this commission.
>
> **Exact required next action:** IPD perform a narrow residual conformance correction and negative tests for those gaps, using the already-effective D03 exact-settled-readback rule (SPEC§3.3). Missing proof must remain UNRESOLVED; no retry. Preserve existing #130 improvements, cap4/v1/W1. Completion requires operation-specific terminal proof or conservative unresolved behavior, consistent exact revision/contribution/provenance/actual-snapshot correspondence and targeted regression/publication evidence. A new broad lock/fsync guarantee is neither required nor authorized.
>
> **Authority:** existing D05 may support exact bounded IPD source/test remediation in its named envelope; routine conforming work does not require re-adopting D03. The responsible IPD session must check the proposed mechanism fits that envelope. New wire operations, IRR runtime/pin changes, schema/semantic expansion or operational mechanism would require a separate exact PA disposition. This IRR task neither changes IPD nor executes its tests. Current evidence is static review, not an executed operational failure.

## Appendix B — citation map (paths and identifiers relied on)

| Item | Identifier |
|---|---|
| IPD authoritative baseline | `origin/main` `f9dac560b821476c417b963c83c80ad0e7747dc7` (tree `e933652dd2c0f486d905de5b5346c8389eebae35`) |
| Implemented-then-corrected by | PR #130 (merge `f9dac560…`); deviations record `evidence/cross-repository/IIPS_V3_D02_D03_D05_PR129_DEVIATION_CORRECTIONS_2026-11-06.md` (qualified by §4.6) |
| Reconstruction work | PR #129 (head `2411f565…`, merge `1cde2324…`) |
| IRR authority publication | IRR PR #491, merge `e482cda4ae7add8f94db041048a172f9941475c9`, 2026-11-06T13:51:24Z |
| R01 document | `docs/integration/PRE-QE-PREREQUISITE-CLOSURE-REPORT-2026-11-06.md`, blob `cf29d886e5f3808a78757ad6d987c6eef2df4201`, 29,962 B |
| Governing contract | SPEC v1.0, blob `38c435995fe4b3d9e434ec02432c59f944c49a7a`, 48,180 B, SHA-256 `4f478ebd8158c0032b1041afca9cfae5e9dec7036eed067b8169cf6697e7ee40` (§3.1 line 69, §3.3 rows, §3.4) |
| Adopting act | `IIPS-V3-PA-D02-D03-D05-ENGINEERING-2026-11-06-01`, blob `cea7fed5618ed08683cf9d12d22b0a6e02c557f4`, 7,532 B; IRR #477; effectiveness receipt `issuecomment-6676618817`; CI `42160555831` / `42160653145` |
| Tracker | `IIPS_V3_E2E_MASTER_TRACKER_AND_IRR_IPD_DECISION_REGISTER_2026-10-13.md` (blob `0e01501a280d3f610cc81b81507543157520ab69`); H06/H10/QE10 rows; CV-248 / §16.268 pointer per PR body |
| Source files (blobs @ `f9dac560…`) | `src/persistence/portfolio_store.ts` `5c12c384…`; `src/persistence/brokerImportPersistence.ts` `49f5ecb3…`; `src/persistence/durablePortfolioStorePort.ts` `d95608d9…`; `tests/durable_holdings_recovery_v1.test.ts` `71b44db9…`; `tests/durable_holdings_contract_v1.test.ts` `10926732…` |
| Main-branch CI at baseline | run `42227275305` (head `f9dac56`) success; check-runs: `typecheck · build · test` success; `executed test count` success (**1056 executed / 1055 passed / 0 failed / 1 skipped**) |
