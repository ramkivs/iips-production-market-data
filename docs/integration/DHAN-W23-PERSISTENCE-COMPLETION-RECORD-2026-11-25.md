# W-23 — Persist Cache/Freshness/Observed State — Completion Record

**Repository:** `ramkivs/iips-production-market-data` (IPD)  
**Work item:** W-23 — Persistence (three separate acceptances)  
**Date:** 2026-11-25  
**Status:** COMPLETE at E1/E2 · E3 outstanding (operator Windows host)  
**Prerequisites:** W-08 COMPLETE, W-19 COMPLETE  

## 1. Exact scope established

Per IRR roadmap §W-23 and §7.3, W-23 closes only the third acceptance (persistence). The first two (restart, cold-cache restart) are operational recovery preconditions, not persistence. A corrupt store must degrade to the cold-cache outcome without failing boot or inventing evidence.

**Retained state (per §1.1):**
- Quote cache — `DhanBoundedCache<CanonicalEnvelope<MarketQuotePayload>>`
- Refresh state — `refreshStatus` map + `lastHistoricalRefresh`
- Observed provider state — `DhanProviderStateRecorder` (history only)

**Non-goals (§1.2):** D02 historical cache (not named in roadmap scope), credentials, autosave, cloud.

**Constraint:** `src/providers/dhan/**` imports nothing from `src/persistence/**` or `src/ipc/**` — grep-asserted. Satisfied by declaring the port inside the provider package and injecting the implementation from the daemon.

## 2. Acceptance criteria and evidence

| # | Acceptance | Criterion | Evidence |
|---|------------|-----------|----------|
| A | Restart | Daemon stops and starts again, serving a request | E2 — `W23-A01/A02` (2 tests): two sequential lifecycles, second serves health+diagnostics with `service: 'UP'`; disabled persistence still restarts cleanly |
| B | Cold-cache restart | With no store, reports `MISS`/`UNKNOWN` honestly, serves cold | E2 — `W23-B01–B04` (4 tests): `getFreshness` HONEST_MISS, diagnostics `size==0`/`EMPTY`/`ABSENT`, HTTP surface parity, zero vendor calls |
| C | Persistence | Cache+freshness+observed state survive restart and stay freshness-consistent | E2 — `W23-C01–C07` (7 tests): original instants preserved, `CURRENT→UNAVAILABLE` aging proven, `CURRENT→STALE` concession, refresh+observed history, auth-latch history-only, snapshot immutability, no credential material |
| D | Corrupt-store degradation | Corrupt/missing/oversized store → cold start, no boot failure, no invention | E1/E2 — `W23-D01–D06` (6 tests): 8 corrupt variants, oversized pre-parse rejection, atomic-write preservation, throwing-port containment, shutdown never blocked, diagnostics validator fail-closed |
| E | No persistence coupling | Zero import edges into `src/persistence/**` or `src/ipc/**` from provider package | E1 — `W23-E01–E03` (3 tests): grep assertion, port declaration audit, file-store dependency audit |
| F | Store location & file behaviour | Correct resolution, no invented path, atomic write, no throw escape | E1/E2 — `W23-F01–F07` (7 tests): explicit→IIPS_DATA_DIR→disabled, NOOP singleton, atomic rename, unwritable-location `FAILED`, duplicate-key rejection, capacity guard |

**E3 outstanding:** Launcher start→verify→stop→restart transcript on the authorised Windows host — requires operator action, not claimable from this sandbox.

## 3. Implementation and files changed

### New files

| Path | Purpose |
|------|---------|
| `src/providers/dhan/dhan_state_store.ts` | Port + wire contract (`DhanPersistedState`, `DhanStateStorePort`, `parseDhanPersistedState`), NOOP + InMemory implementations |
| `src/providers/dhan/dhan_file_state_store.ts` | File-backed store (atomic temp+rename, `0o600`, 8 MiB cap, fail-closed, no throws) |
| `tests/dhan_w23_persistence.test.ts` | 29 tests (W23-A…W23-F) |
| `docs/integration/DHAN-W23-PERSISTENCE-CONTRACT-AND-DESIGN-2026-11-25.md` | Contract/design doc (written before code) |
| `docs/integration/DHAN-W23-PERSISTENCE-COMPLETION-RECORD-2026-11-25.md` | This file |

### Edited files

| Path | Change |
|------|--------|
| `src/providers/dhan/dhan_market_data_service.ts` | `DhanDiagnosticsPersistenceState` + validator + version 2→3, `snapshotRetainedState()`/`persistRetainedState()`/`getStateRestoreReport()`/`restoreRetainedState()`, startup restore + freshness-consistent reclassification, auth-latch history-only |
| `src/providers/dhan/dhan_operational_controls.ts` | `DhanBoundedCache.snapshotInLruOrder()`/`restoreEntry()`/`isEmpty()` for LRU-faithful restore |
| `src/providers/dhan/dhan_provider_state_recorder.ts` | `GOVERNED_AUTH_OUTCOMES` + `restoreObservedState()` (returns `priorAuthLatched`, never restores active latch) |
| `src/providers/dhan/dhan_local_daemon.ts` | `MARKET_DATA_STATE_PATH_ENV`/`IIPS_DATA_DIR_ENV`/`DEFAULT_MARKET_DATA_STATE_RELATIVE_PATH`, `resolveStateStore()`/`resolveStateStorePath()`, `MarketDataDaemonStatePersistence` diagnostics, `lastPersistOutcome` on handle, `shutdown()` persists before stop |
| `tests/dhan_w09_diagnostics_endpoint.test.ts` | Expected persistence block + version 3 |
| `tests/dhan_w11_daemon_configuration.test.ts` | Version 3 |
| `tests/dhan_w25_configurable_freshness_thresholds.test.ts` | Version 3 + version-2 rejection |

## 4. Persistence and restart-recovery test results

```
W23-A  2/2  pass — restart
W23-B  4/4  pass — cold-cache restart
W23-C  7/7  pass — persistence (incl. aging, latch, no-leak)
W23-D  6/6  pass — corrupt/oversized/throwing-store degradation
W23-E  3/3  pass — import-isolation
W23-F  7/7  pass — location & file behaviour
Total 29/29 pass · 0 fail
```

## 5. Full verification and CI results

- `build:tsc` — exit 0
- `tests/dhan_w23_persistence.test.js` — 29/29 pass
- `tests/dhan_w09_diagnostics_endpoint.test.js` + `dhan_w11_daemon_configuration.test.js` + `dhan_w25_configurable_freshness_thresholds.test.js` — all pass (version-3 alignment)
- Full suite — 168 files, via `npm test` harness (test-guard reports 168 source files; individual test counts via `node --test dist/tests/*.test.js` — all pass, no regressions)
- Grep assertion — `src/providers/dhan/**` zero `persistence/`/`ipc/` import edges (E1)

## 6. Remaining blockers

| Blocker | Resolution |
|---------|------------|
| E3 restart transcript on authorised Windows host | Operator runs launcher start→verify→stop→restart covering all five services |
| W-23 diagnostics `contractVersion` is 3 vs authoritative roadmap's `2` | Roadmap table (§8.3) to be reconciled in the next roadmap refresh — the version bump is required (additive-but-required persistence block) |

No code blockers. No verification failures requiring follow-up code changes.

## 7. Final W-23 status and next roadmap step

**W-23: COMPLETE (E1/E2) · E3 PENDING** — counted in the roadmap roll-up (25 COMPLETE, 9 NOT STARTED).

**Next roadmap step per the current execution roadmap (§4, §6, §7):**

- **Immediately executable (no external decisions):** W-24 (trace correlation — awaiting IRR acceptance of D-7 amendment before IPD implementation), W-05 (read posture/latch), W-36/W-37/W-38 (launcher/runbook/preflight), W-14/W-17 (readiness-only, authorisation-gated).
- **Next in lane A (IPD freshness/completion):** W-23 is now done; the lane's remaining governed scope is W-24 IPD half.
- **E3 operational closure** for W-23 itself requires the Windows host transcript — tracked as E3 PENDING, not as NOT STARTED.
