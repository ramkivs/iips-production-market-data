# P05-03 — OPEN ITEMS, BOUNDED DEPENDENCIES AND EXPLICIT NON-RESOLUTIONS

| | |
|---|---|
| **Unit** | **P05-03-A** — historical OHLCV ingestion contract |
| **Date** | 2026-09-09 |
| **Authorization** | D9 §3 **A-3** — specification / adapter-contract only |

> ⚠ **Nothing below is resolved by P05-03-A.** These are recorded so that no later reader has to
> infer what was and was not settled. Recording an open item is **not** resolving it (**IB-2**).

---

## 1. Carried-forward open items — unchanged

| Item | Before | After | Note |
|---|---|---|---|
| **OI-P04-04** — FIGI sourcing, licensing, coverage | **OPEN** | **OPEN** | Untouched. Synthetic values only; **no** licensing or coverage claim. Carried as **DEP-P04-10**. ⚠ Its own record states *"Blocks preparation? **NO**"* — which is precisely why A-3 spec work was executable while licensed acquisition is not |
| **OI-P04-03** — tenant/region governance attribute set | **OPEN** | **OPEN** | **No attribute invented, no default supplied.** Bounded by **IB-1…IB-5**. Lifting **IB-1** requires an explicit **A1** act |
| **OI-08 / OI-09 / OI-10** | RESOLVED | RESOLVED | 1:N · FIGI/OpenFIGI authoritative · token exactly `MD:` — all unchanged |
| **ADR-01 C1–C6** | 6 of 6 UNCHANGED | 6 of 6 UNCHANGED | Not touched |
| **DEP-P01-04** — historical series structure | UNRESOLVED | **UNRESOLVED** | **P08** storage decision. Explicitly **not** resolved here |
| **M-1 / AD-4**, **M-5**, **M-6**, **AD-17 / M-2** | OPEN | OPEN | Not repaired |

---

## 2. BD-P05-03 — bounded dependencies and non-resolutions

| ID | Item | Status | What it blocks |
|---|---|---|---|
| **BD-P05-03-01** | **Licensed / deeper historical depth** | **OPEN** | The P05-03 tracker exit criteria and any real historical sample. **OI-P04-04 · D9 N-2** |
| **BD-P05-03-02** | **P04-02 provider-level exit criterion** — *"All supported providers resolve mappings"* | **UNMET** | Live historical acquisition. ⚠ The accepted `P04_IDENTITY_ADAPTER_CONTRACT.md` supplies the **contract**; the **provider-level** criterion cannot be met while no provider is selected |
| **BD-P05-03-03** | **`barInterval` is not enumerated by any accepted artifact** | **OPEN** | Any interval other than **`1D`**. `P01_FIELD_DICTIONARY` §4 types it as an `enum` but lists **no values**. **HA-6** treats it as a declared, versioned capability; adding `1H/5M/15M/1W` needs an authority act (**D9 N-6**) |
| **BD-P05-03-04** | **DEP-P01-04** — historical series structure / storage | **UNRESOLVED** | Series-level storage and PIT query. Owner **P08**. ⚠ The P05-01 one-bar-per-snapshot precedent is **reused** but does **not** pre-empt it |
| **BD-P05-03-05** | **Adjusted-series implementation / adjustment engine** | **NOT PERFORMED** | Adjusted D02 output. Owner **P08** (**RC-5**) |
| **BD-P05-03-06** | ⚠ **`P01_SCHEMA_CATALOG` D02 lists `sessionRef` but `P01_FIELD_DICTIONARY` §4 does not define it** | **OPEN** | Emitting `MD:ohlcv.sessionRef`. **Recorded, NOT invented** — no accepted artifact defines the field, so it is not emitted |
| **BD-P05-03-07** | **Tenant/region governance attribute set** | **OPEN** | Per-record tenant/region application. **OI-P04-03 · IB-1…IB-5 · D9 N-4/N-5** |
| **BD-P05-03-08** | **P05-04 orchestration** — scheduling, retry execution, checkpointing | **NOT AUTHORIZED** | Load orchestration and retry **execution**. **D9 N-3**. **HA-27** classifies retryability only |
| **BD-P05-03-09** | **A3 gate acceptor** for P05 acceptance | **UNKNOWN** | P05 gate acceptance — the only **person-level** hard blocker. No person is named in `P00_AUTHORITY_REGISTER.md` or `D9_STATUS.json` |
| **BD-P05-03-10** | ⚠ **The A-23/SM-4/PR-8 secret scanner false-positives on long camelCase identifiers** | **OPEN** | Nothing functional, but it constrains naming. See §3 |

---

## 3. ⚠ Two disclosures

### 3.1 One existing test was **scoped**, not weakened

`p05/tests/no-provider-dependency.test.js` required P05-01 implementation modules to **never even
name** "retry", excluding only `liveAdapterContract.js`. Its own comment states the principle: a
**contract** module may **classify** retryability but may not **implement** a retry policy.

`historicalAdapterContract.js` falls in that same category under **D9 A-3**, so the carve-out was
extended to it. **Not a weakening:**

- the **identical behavioural assertions** applied to the P05-02 contract module (no backoff, no
  retry loop, no attempt counter, no wait primitive) are now applied to the P05-03 module **too**;
- `historical-adapter-contract.test.js` **HA/19** asserts them **again independently**;
- the **P05-01 implementation set keeps the strict rule unchanged**;
- **no P05-01 assertion was altered.**

### 3.2 The A-23 secret scanner's 40-character heuristic (`BD-P05-03-10`)

`scanForSecrets` matches `["'][A-Za-z0-9+/]{40,}={0,2}["']` and scans **JSON whole**, so a 40+
character camelCase identifier is indistinguishable from a base64 blob. Two consequences:

1. **Two P05-03 keys were shortened** — the fully expanded PC-1 key → `pubAndEffTimeSeparatelyPreserved`,
   and the fully expanded attestation key → `claimsRealDataLoadReproducible`. **Meanings are
   unchanged.** ⚠ **The P05-01 scanner was NOT modified.**
2. ⚠ **A real blind spot was observed and is recorded, not fixed.** `scanForSecrets` tests only the
   **first** match per pattern and exempts it if it is pure hex. So a file whose *first* long token
   happens to be a hex digest is **not scanned further** — a genuine credential later in the same
   file would be missed. This **extends BD-P05-02-06** (the serialized-JSON blind spot). Repairing
   the P05-01 scanner is **out of P05-03 scope** and would change P05-01 behaviour.

---

## 4. Explicit non-resolutions

| # | Not resolved here |
|---|---|
| 1 | **The tracker exit criterion *"Historical load reproducible"*.** Demonstrated for **synthetic contract behaviour only** (PC-3). Requires a licensed real-data load |
| 2 | **The tracker evidence column *"Historical sample"*.** Would require licensed acquisition (**D9 N-2**) |
| 3 | **The tracker test column *"Load/reconcile tests"*.** Exercised against **synthetic fixtures only** |
| 4 | **Any bar interval other than `1D`** (**BD-P05-03-03**) |
| 5 | **Adjusted D02 output** (**BD-P05-03-05**) |
| 6 | **How a historical series is stored or queried** (**BD-P05-03-04 / DEP-P01-04**) |
| 7 | **Whether a missing bar *should* have existed.** No accepted artifact supplies a trading calendar, so `completenessBasis` must be **declared** by the caller (**HA-23**). A completeness figure derived from an invented calendar would be a fabricated number |
| 8 | **Any tenant or region semantics** (**BD-P05-03-07**) |

---

## 5. Boundary summary

**P05 = AUTHORIZED / NOT_ACCEPTED** · still **5 of 18** gates · **no `P05_GATE_ACCEPTANCE.md`** ·
**CERTIFICATION = `NONE_GRANTED`** · **PRODUCTION ACTIVATION = `NOT_AUTHORIZED`** ·
**P05-04 = NOT AUTHORIZED** · **P06/P07/P08 = NOT STARTED**.

**No new authority decision was created by this unit.**
