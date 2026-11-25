# W-23 — Persistence: Contract, Design and Acceptance Evidence Requirements

**Repository:** `ramkivs/iips-production-market-data` (IPD)
**Work item:** W-23 — Persist cache/freshness/observed state; three separate acceptances
**Date:** 2026-11-25
**Status:** contract and acceptance requirements fixed **before** implementation.
**Prerequisites:** W-08 (COMPLETE), W-19 (COMPLETE) — both verified present at `04368ae`.

> Written first, implemented after. Where implementation and this document disagree, this
> document is the defect report.

---

## 1. Scope, quoted from the authoritative roadmap

IRR `DHAN-LIVE-INTEGRATION-IMPLEMENTATION-ROADMAP-2026-11-11.md` §W-23:

> **Scope** — Persist the quote cache, refresh state and observed provider state to a local
> file under the existing runtime/state directory, loaded at start. **Constraint:**
> `src/providers/dhan/**` currently imports nothing from `src/persistence/**` or `src/ipc/**`;
> preserve that by defining a small storage port injected by the daemon (or a self-contained
> local store inside the provider package). Bounded, single-user, no cloud.

And §7.3, which is normative for the acceptances:

> **Restart versus persistence — three separate acceptances, never conflated:**
> 1. **Restart** — the daemon stops cleanly and starts again, serving requests. (E3.)
> 2. **Cold-cache restart** — with no persistence store present, the daemon starts, reports
>    `MISS`/`UNKNOWN` honestly, and serves cold. (E3.)
> 3. **Persistence** — previously valid cache and freshness evidence survive the restart and
>    remain freshness-consistent. (E3 with W-23.)
>
> A successful restart (1) is **not** evidence of persistence (3). Only W-23's third acceptance
> closes persistence, and a corrupt or missing store must degrade to (2).

Plus the corrupt-store requirement from the W-23 Verification row: *"a corrupt store file
degrades safely to a cold start without failing boot or reporting invented evidence."*

### 1.1 Exactly what must persist

| State | Owner today | Persisted? | Why it must survive |
|---|---|---|---|
| Quote cache | `DhanBoundedCache<CanonicalEnvelope<MarketQuotePayload>>` | **Yes** | A restart must not force a re-fetch of a still-valid quote |
| Refresh state | `service.refreshStatus` map + `lastHistoricalRefresh` | **Yes** | "when did we last try, and did it work" is operational history |
| Observed provider state | `DhanProviderStateRecorder` | **Yes** | last success/failure/auth outcome/latch is recovery evidence |
| D02 historical cache | `DhanHistoricalCache` | **No** — see §1.2 | Out of the stated scope |
| Credentials | Vault (W-02/D-2) | **No, never** | Already separately persisted; persisting them again would be a second credential store |

### 1.2 Deliberately excluded: the D02 historical cache

The roadmap's Scope names "the quote cache, refresh state and observed provider state". It does
**not** name the historical cache added by W-19. Persisting it would be a scope expansion with
its own evidence burden (four-timestamp integrity, revision/digest chain, cache-instant vs
retrieval-instant separation across a restart), and W-19's own record keeps those rules strict.
This record states the exclusion rather than leaving it ambiguous. A D02 observation therefore
stays per-process, and `getFreshness({domain:'D02_OHLCV'})` after a restart honestly reports
`NO_OBSERVATION` — which is acceptance (2) behaviour, not a defect.

---

## 2. The storage port

**Constraint honoured literally: no new import edge from the provider into `src/persistence/**`
or `src/ipc/**`.** Verified at `04368ae` that neither is imported today, and the exit criterion
is a *grep assertion*, so the design must keep the provider package free of both.

Chosen shape — **an interface declared inside the provider package, implemented by the
provider-neutral core**:

```ts
// src/providers/dhan/dhan_state_store.ts   (inside providers/dhan, imports nothing from persistence/)
export interface DhanPersistedState { ... }        // the wire shape
export interface DhanStateStorePort {              // the seam the service talks to
  load(): DhanStateLoadOutcome;
  save(state: DhanPersistedState): DhanStateSaveOutcome;
}
```

Why a port rather than importing an existing `src/persistence` module:

1. It satisfies the constraint by construction — the *interface* lives in the provider, so the
   provider depends on nothing.
2. The daemon already does its own file I/O (`readFileSync` for the calendar and the mapping
   manifest), so file access at the daemon layer is the established pattern rather than a new one.
3. The in-memory implementation used by tests needs no filesystem at all, so the service's
   behaviour is testable without touching disk.

The daemon supplies a **file-backed** implementation
(`src/providers/dhan/dhan_file_state_store.ts`), which is also inside the provider package and
uses only `node:fs` — still zero import edges into `src/persistence/**` or `src/ipc/**`.

### 2.1 Load outcome vocabulary

`load()` returns a discriminated union that cannot conflate "nothing there" with "something was
there and I could not read it":

| Outcome | Meaning | Service behaviour |
|---|---|---|
| `{ status: 'ABSENT' }` | no store file | cold start; report `MISS`/`UNKNOWN` honestly (acceptance 2) |
| `{ status: 'LOADED', state }` | parsed and validated | restore, then re-classify (acceptance 3) |
| `{ status: 'CORRUPT', reason }` | present but unreadable/invalid/oversized | cold start, **never** fail boot, **never** invent evidence |

`CORRUPT` covers both parse failures (`INVALID_JSON`, `SCHEMA_MISMATCH`, `INVALID_SHAPE`, `TOO_LARGE`) and I/O errors (`READ_ERROR`), rather than a separate `UNREADABLE` outcome. A single failure vocabulary keeps the restore report and diagnostics simpler: every non-absent failure is one status with a bounded reason, and no path is ever echoed to a caller.

The service never throws from a store outcome and never boots differently. The outcome is
recorded so diagnostics can state *why* the process started cold — otherwise "cold" and
"restore failed" would be indistinguishable to an operator, which is the same defect class W-25
removed from the threshold path.

---

## 3. Retained-state contract

```ts
export interface DhanPersistedState {
  readonly schemaVersion: 1;                 // anything else => CORRUPT
  readonly writtenAt: string;                // ISO-8601 UTC
  readonly quotes: readonly DhanPersistedQuoteEntry[];
  readonly refresh: readonly DhanPersistedRefreshEntry[];
  readonly observed: DhanPersistedObservedState | null;
}
```

### 3.1 Quote entries

Each entry carries the cache key, the full envelope, and the LRU position:

```ts
{ key: string; envelope: CanonicalEnvelope<MarketQuotePayload>; order: number }
```

Persisting the *full envelope* rather than a reduced row is deliberate: the freshness
projection reads `provenance.asOf`, `receivedAt`, `evaluatedAt` and the payload's exchange, so a
reduced row would require re-deriving those at load time — which is exactly where invented
evidence creeps in.

### 3.2 Freshness consistency across a restart — the hard requirement

Acceptance (3) says the evidence must survive **and remain freshness-consistent**. That imposes
three rules:

1. **`asOf` is never re-stamped.** A quote fetched at 10:00 and restored at 12:00 is two hours
   old, not fresh-at-restore. Restoring must not touch `provenance.asOf`, `receivedAt` or
   `evaluatedAt`. `evaluatedAt` in particular records when *that observation* was evaluated; the
   post-restart read reports its own `evaluatedAt` separately.
2. **Classification is recomputed, never restored.** The stored `cacheState` is *not* trusted.
   On load, every entry is re-classified against the current clock and current thresholds, so a
   quote that was `CURRENT` at shutdown becomes `UNAVAILABLE` after a long outage. Persisting a
   verdict and replaying it would make an outage look like freshness.
3. **Entries already past suppression are not resurrected.** An entry whose re-classification is
   `UNAVAILABLE` is dropped during restore rather than admitted and immediately hidden: admitting
   it would leave the cache reporting a size that includes evidence no caller may use. Dropping
   it is recorded as a count in the restore outcome.

### 3.3 Refresh state and observed state

Both are reported as **last-known, with their original instants**. They are recovery *evidence*,
not live claims:

- `lastSuccessAt` restored from disk says "the last success this platform recorded was at X".
  It does **not** say the provider is reachable now.
- `authLatched` is **not** restored as an active latch by default. See §3.4.
- The recorder's monotonic counters (`vendorSuccesses`, `providerFailures`,
  `marketDataSuccesses`) are **not** persisted. They are process-lifetime interaction counts,
  and carrying them across a restart would make a restarted process claim interactions it did
  not perform. `localReadinessVerified` is likewise process-local (it records that this process
  probed the vault).

### 3.4 The auth latch across a restart — a deliberate decision

The W-05 latch exists to stop a process hammering the vendor with a credential the vendor
rejected. That purpose is **process-scoped**: after a restart the operator has had an
opportunity to rotate the credential, and refusing to try at all would make the documented
recovery route unreachable while reporting a legitimate rotation as a failure.

Decision: **persist the fact, restore it as history, do not restore it as an active latch.**

- `observed.lastAuthOutcome`, `lastSuccessAt`, `lastFailure`, `lastLatencyMs` and
  `consecutiveAuthFailures` are restored as reported history.
- `authLatched` is restored as **`false`** with `restoredAuthLatch: boolean` recording that the
  previous process *was* latched, surfaced in diagnostics as
  `restore.authLatchClearedByRestart: true`.

This is the only place where restored state differs from stored state, it is stated in
diagnostics, and it is the conservative direction for availability while leaving the latch
threshold (2 consecutive failures) to re-trigger within the new process if the credential is
still bad. Restoring an active latch is the alternative and is rejected because it converts a
restart from a recovery action into a no-op.

---

## 4. Lifecycle — when save and load happen

| Point | Action | Failure handling |
|---|---|---|
| **Start** (service construction, before serving) | `port.load()` → validate → re-classify → admit | Any failure degrades to cold start; boot is never refused |
| **Shutdown** (`handle.shutdown()`) | `port.save(snapshot())` | A save failure is reported in the handle/diagnostics and **never** prevents shutdown |
| **On demand** | not provided | — |

**No autosave timer.** A timer would add a background writer whose failure mode is a partially
written store, and the roadmap bounds the feature to "bounded, single-user, no cloud". One save
at one deterministic moment is enough for the acceptance and is far easier to reason about.

**Write atomicity.** `save()` writes to `<path>.tmp-<pid>` and renames onto the target, so a
crash mid-write leaves the previous store intact rather than a truncated one. This is what makes
the corrupt-store path an exceptional case rather than the normal one.

---

## 5. Store file location and naming

`IIPS_MARKET_DATA_STATE_PATH` overrides the location; default is
`<IIPS_DATA_DIR>/dhan/market-data-state.json`, and `IIPS_DATA_DIR` already exists as the
project's data root convention. When neither is set, **persistence is disabled** (`ABSENT`
semantics) rather than guessing a path — a daemon that writes to an unspecified location is
worse than one that does not write at all. The daemon reports which it did.

The file contains quote payloads and provider state. It contains **no credential material** —
asserted by a test that greps the serialized store for the token/key-path canaries, because a
persistence layer is exactly where a credential leak would be hardest to notice.

---

## 6. Acceptance evidence requirements

Each acceptance is evidenced **separately**, per §7.3's explicit warning that they must not be
conflated. This records what each one must show and which test proves it.

| # | Acceptance | Evidence required | Evidence class |
|---|---|---|---|
| **A** | **Restart** — daemon stops cleanly and starts again, serving a request | Two sequential `startMarketDataDaemon` lifecycles on the same port; the second serves an authenticated request (health and diagnostics) with `service: 'UP'`. Does **not** claim persistence. | E2 (synthetic, offline) |
| **B** | **Cold-cache restart** — no store present: starts, reports `MISS`/`UNKNOWN` honestly, serves cold | Start with no store file anywhere; `getFreshness` for a never-fetched quote scope reports `cacheState: 'MISS'` / `verdict: 'UNKNOWN'` / `ageSeconds: null`; diagnostics `quoteCache.size === 0`; **zero** fabricated evidence in the payload. | E2 |
| **C** | **Persistence** — a cache entry and freshness evidence written before the restart are readable, correct and freshness-consistent after it | Process 1 caches a real quote (fetched through the scripted transport), persists; process 2 loads, exposes the entry, and reports the **preserved** `asOf`/`receivedAt` with a **recomputed** classification. Includes the "aged across the outage" case: an entry that was `CURRENT` pre-restart reports `STALE`/`UNAVAILABLE` after a clock jump, proving the verdict is not replayed. | E2 |
| **D** | **Corrupt store degrades** to a cold start without failing boot or inventing evidence | Truncated JSON, wrong `schemaVersion`, non-JSON bytes, wrong types, an oversized file, and each are asserted to produce `CORRUPT` → boot succeeds → `MISS`/`UNKNOWN`, no partial admission. | E2 |
| **E** | **No persistence coupling** in the provider modules | Grep assertion over `src/providers/dhan/**` for `persistence/` and `ipc/` import edges: zero. | E1 |

### 6.1 What these acceptances are *not*

Per the roadmap's evidence ladder, all five are **E1/E2**. None of them is E3 (local Windows
operational verification), because this sandbox is not the authorised Windows host and cannot
run the launcher. Acceptance (A) and (C) at **E3** require the operator to run the start/stop/
restart sequence on that host. This record therefore claims **E2** and states the E3 step as
outstanding — it does not upgrade synthetic evidence to operational verification.

---

## 7. Non-goals

- No D02 historical-cache persistence (§1.2).
- No credential persistence — that is the vault's job and D-2 governs the read posture.
- No autosave timer, no WAL, no multi-writer coordination (§4).
- No cross-machine or cloud store; single-user local file only, per the roadmap's design bounds.
- No change to freshness semantics: W-25 owns thresholds, AD-12 owns bands, W-19 owns D02
  evidence. W-23 changes only *whether the evidence survives a process boundary*.
