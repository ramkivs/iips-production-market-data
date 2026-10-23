# CAP-02 U2 Part A — transaction/binding revalidation technical correction

**Status: EFFECTIVE — supplemental exact-scope amendment to `IIPS_V3_CAP02_G3_AMEND_02_U2_EFFECTIVE_2026-10-23.md`.** This record corrects one implementation detail before any source mutation. It does not broaden U2 behavior, alter the IPC contract, or enable writes.

| Item | Value |
|---|---|
| Repository/baseline | IPD `main@24b9ca43ad9589f80b64934aa10ba1fb6e5b8777`, tree `624271f02912b43a96b046154ded98d2b9bb8882` |
| Authority | Standing PA global grant (F-3 blob `c4c9f7d79ef181af96f6c4e5cc108288ef22fd02`), DEC-06 R-1/R-3/R-6/R-7 (IRR blob `4be3ea578a51a1a949337e5d218b89841c04892d`), current execution direction, and effective U2 Part A act. |
| Affected source baseline | `src/persistence/binding.ts` blob `4c5ea0d55ce2f9f4ec7dec124f9bfc122badef30` |

## Verified correction

`resolveActiveBinding(db)` begins an immediate transaction, reads the active binding/membership, then commits; on error it rolls back. Calling it from the already-open request transaction proposed by U2 Part A would attempt a nested `BEGIN IMMEDIATE` and fail. Therefore the original Part A statement “call `resolveActiveBinding` inside the new transaction” is technically impossible as written.

## Exact additional manifest

`src/persistence/binding.ts` may receive one additive function, `resolveActiveBindingInCurrentTransaction(db)`, which runs the same active-binding/membership predicate without issuing `BEGIN`, `COMMIT`, or `ROLLBACK`. Its documented precondition is that the caller owns an active `BEGIN IMMEDIATE` transaction on this same connection. Existing `resolveActiveBinding` retains its existing standalone transaction semantics, implemented through the shared predicate; no authorization, identity, row selection, error taxonomy, or exposure change is allowed.

`tests/q1_broker_import_durability.test.ts` may add assertions that the new function requires/uses the caller-held transaction, preserves it on success, and does not commit/rollback it; tests must cover no binding, multiple/inconsistent binding data, and successful active binding. The request transaction must call the new function and compare the resolved owner/membership to the request owner before any portfolio mutation.

This supplemental authority is limited to this correction and these tests. It does not permit edits to migration 003, provisioning, dispatch, protocol, routes, IRR, or Gate E authorization. `WRITE_NOT_AUTHORIZED` remains first and hard-false. A merge of this record is publication evidence, not a substitute for implementation or Gate acceptance.

*Rendered under the standing PA grant and current PA-directed execution; no signature or additional approval is fabricated.*