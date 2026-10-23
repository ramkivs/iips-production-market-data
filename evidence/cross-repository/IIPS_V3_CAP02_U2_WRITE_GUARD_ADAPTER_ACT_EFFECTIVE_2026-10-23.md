# CAP-02 U2 — write-guard adapter exact-scope amendment

**Status: EFFECTIVE — supplemental to the U2 Part A and Part B acts.** This act authorizes only the adapter method necessary to preserve the existing write guard while invoking the already-authorized atomic import transaction. It does not authorize or enable a write.

| Item | Value |
|---|---|
| Repository/baseline | IPD `main@6bf081b176d034ac62714f556652b16e8fa2995a`, tree `b39e1610b832a1bf5248159825d871c399f5c4be` |
| Path/baseline | `src/persistence/durablePortfolioStorePort.ts`, blob `2bba27f48bf88212525096a11887f81bc7b1e7c8` |
| Authority | Standing PA grant (IRR F-3 blob `c4c9f7d79ef181af96f6c4e5cc108288ef22fd02`), DEC-06 R-1/R-3/R-6/R-7 (IRR blob `4be3ea578a51a1a949337e5d218b89841c04892d`), current PA-directed execution, and effective U2 Part A decision. |

## Exact allowed change

Add `withBrokerImportTransaction(owner, work)` to `DurablePortfolioStorePort`. Its first action must call the existing `assertWritable()` and therefore throw `WriteNotAuthorizedError` before opening a database transaction or evaluating the callback while W-1 is false. Only if that unchanged guard authorizes may it delegate to `DurablePortfolioStore.withBrokerImportTransaction` with the same owner and callback. No new configuration, environment switch, authorization token, store bypass, or write route is permitted.

The existing methods, guard logic, durability vocabulary, and IPC caller behavior remain unchanged. Tests in the already-authorized `tests/q1_broker_import_durability.test.ts` must prove the W-1 denial returns before transaction/callback invocation with zero effect. The successful fixture path remains non-production qualification evidence only. No Gate 4/5 or operational write status changes.

*Rendered under the standing PA grant and current PA-directed execution; no signature or additional approval is fabricated.*