# R-2 — MARKET-DATA FOUNDATION: IMPLEMENTATION & READINESS REPORT

**Workstream:** R-2 (provider-neutral market-data foundation) — *user-defined workstream label.
"R-2" is **not** a work-item id in `TRACKER`; verified 0 tracker matches this turn.*
**Branch:** `arena/01a0853c-iips-production-market-data`
**Date:** 2026-09-15
**Test result:** `r2` **273/273 pass** · existing regression `p05` **264/264**, `p06` **113/113** (both unchanged)

**Classification key** — every numbered item in §R is tagged:
`IMPLEMENTED` · `TESTED` · `READY` · `EXTERNALLY BLOCKED` · `REQUIRES AUTHORITY DECISION`

---

## 1. Executive status

The **provider-neutral** R-2 foundation is implemented and tested: canonical contract, adapter
boundary, CM-UDiFF parser, equity eligibility filter, deterministic normalization, quality
control, reconciliation, freshness/staleness control, 15-minute scheduler, current-state refresh,
EOD ingestion, configurable backfill, storage port, secrets interface, UI data contract, and
deterministic reference fixtures — **273 deterministic tests, 0 dependencies**.

**Two items are NOT claimed and must not be read as done:**

1. **No live NSE market-data capability is claimed** (§L.66, §E.29). The real acquisition
   mechanism is an external licensing/entitlement gate that is **fully outstanding**.
2. **No durable persistence was introduced.** §D.23's STOP condition was **triggered** and is
   escalated rather than resolved (§16, §24). R-2 is written against a storage *port* with an
   in-memory reference adapter, so the durable implementation is a drop-in substitution.

**No historical data is loaded.** Ten years are **not** populated and are not claimed (§I.55).

---

## 2. What was implemented

`r2/` — 18 source modules (3,120 lines), 14 test modules (1,833 lines), 6 labelled synthetic
fixtures. Zero runtime dependencies, matching the `p05`/`p06` convention.

| Module | Responsibility | Status |
|---|---|---|
| `canonicalContract.js` | `r2.equity.daily@1.0.0`; §H field dictionary; AD-6 `snapshotId`; INV-2 freeze; INV-10 leakage guard | IMPLEMENTED · TESTED |
| `errorTaxonomy.js` | P02 **E1–E8 reused verbatim** (no new codes); §E.32 condition→code map | IMPLEMENTED · TESTED |
| `providerAdapter.js` | adapter port; capability pre-flight (E6); §L.66 gate as data; §L.67 prohibited mechanisms | IMPLEMENTED · TESTED |
| `cmudiffParser.js` | CM-UDiFF Common Bhavcopy Final, **header-driven**; legacy-format refusal; invalid-numeric detection | IMPLEMENTED · TESTED |
| `equityEligibility.js` | **default-deny** equity filter; §F.39 debt/NCD/SGB exclusion | IMPLEMENTED · TESTED |
| `normalization.js` | deterministic normalization; §F.43 canonical key | IMPLEMENTED · TESTED |
| `qualityValidation.js` | OHLC, contradictions, timestamps, symbols → accept/reject/quarantine | IMPLEMENTED · TESTED |
| `freshness.js` | §Q.88 derived threshold; §Q.90 usability | IMPLEMENTED · TESTED |
| `currentStateRefresh.js` | §E.31 idempotent refresh; all §E.32 conditions | IMPLEMENTED · TESTED |
| `scheduler.js` | provider-neutral ~15-min scheduler, injected clock, retry policy, missed-schedule reporting | IMPLEMENTED · TESTED |
| `eodIngestion.js` | §F.36 nine-stage pipeline; §F.42/43 idempotency; §J metrics | IMPLEMENTED · TESTED |
| `backfill.js` | §I.50–57 configurable range, incremental, resume; requested≠populated | IMPLEMENTED · TESTED |
| `reconciliation.js` | row accounting, duplicates, completeness, contradictions | IMPLEMENTED · TESTED |
| `storagePort.js` | `MarketDataStore` port + in-memory **reference** adapter (durable DEFERRED) | IMPLEMENTED · TESTED |
| `uiDataContract.js` | provider-neutral projection; §C.17 status; §Q.87 price suppression | IMPLEMENTED · TESTED |
| `config.js` | §M SecretRef (names only), literal detection, redaction | IMPLEMENTED · TESTED |
| `mockAdapter.js` | deterministic file-based reference adapter with fault injection | IMPLEMENTED · TESTED |
| `fixtures.js` | fixture loader; `synthetic: true` provenance | IMPLEMENTED · TESTED |

---

## 3. What was tested / 4. Exact test results

```
$ cd r2 && node --test "tests/**/*.test.js"
# tests 273   # pass 273   # fail 0   # cancelled 0   # skipped 0

$ cd p05 && node --test "tests/**/*.test.js"     # pass 264  # fail 0   (pre-existing, unchanged)
$ cd p06 && node --test "tests/**/*.test.js"     # pass 113  # fail 0   (pre-existing, unchanged)
```

**650 tests total, 0 failures.** No existing test was weakened, skipped or deleted (§N).

Coverage by §N requirement: source parsing ✓ · CM-UDiFF contract parsing ✓ · equity filtering ✓ ·
normalization ✓ · canonical contract ✓ · duplicate handling ✓ · missing values ✓ · malformed
records ✓ · invalid numeric values ✓ · OHLC validation ✓ · stale-data detection ✓ · freshness
calculation ✓ · 15-minute scheduler ✓ · current-state refresh ✓ · failure/retry behaviour ✓ ·
EOD ingestion ✓ · historical backfill ✓ · incremental backfill ✓ · resume/restart ✓ ·
idempotency ✓ · reconciliation ✓ · provider-adapter contract compliance ✓ · UI/data-contract
integration ✓ · visible freshness/status behaviour ✓.

---

## 5. UI / data-contract changes — `REQUIRES AUTHORITY DECISION`

The **contract** is implemented and tested (`uiDataContract.js`): `projectStatus`,
`projectQuote`, `projectCurrentState`, exposing current-vs-stale, last successful refresh, data
source, data date/time, availability, and §Q.90 usability — with **no provider-native field**
(runtime-enforced against P01 INV-10 / NFR-06).

**Wiring into the existing UI was NOT possible on this branch.** Verified: on
`arena/01a0853c-iips-production-market-data`, `git ls-files` returns **0** files under
`frontend/` and **0** under `iips-platform/`. The React app exists only on
`arena/01a0853d-iips-production-market-data` and `m1-ad4-repair`, and this session may not switch
branches. **§C.15's "where the existing architecture permits it" therefore does not permit it
here.** Authority must decide whether integration happens on a UI-bearing branch.

---

## 6. Canonical market-data schema — `IMPLEMENTED · TESTED`

`r2.equity.daily@1.0.0` · currency `INR` · **24 fields**.

REQUIRED (15): `tradeDate, exchange, isin, symbol, series, close, priceCurrency, sourceId,
sourceRef, sourceTimestamp, ingestionTimestamp, provider, dataVersion, asOf, snapshotId`.
OPTIONAL (9): `securityName, open, high, low, lastPrice, previousClose, volume, tradedValue,
transactionCount, freshness`.

Lineage reuses the **frozen** AD-6 format `data-${provider}-${dataVersion}-${asOf}`
(`P01_DATA_CONTRACT.md` §3.1 row 1) — no component added. Versionable via `SCHEMA_DESCRIPTOR`.

⚠ **Design correction made during implementation:** `freshness` was initially declared REQUIRED
on the record, which rejected **every** EOD bar. It is a property of the *current-state view*,
not of an immutable historical bar (INV-2), so it is now optional and attached at projection
time. This was caught by test, not by review.

---

## 7. Provider / adaptor contract — `IMPLEMENTED · TESTED`

`bindAdapter` validates at bind time. Required: `id`, `describe()`, `fetchEodDaily()`,
`fetchCurrentState()`, `capabilities[]`. Requests outside declared capabilities fail **pre-flight**
with P02 **E6** before any provider call. Swap-in of a future authorised adapter is a checked
substitution, not a refactor.

**P02 E1–E8 are reused verbatim; no R-2 error vocabulary was created.** §E.32's eight conditions
map onto them explicitly (`REFRESH_CONDITIONS`).

---

## 8. NSE EOD / Bhavcopy status — `IMPLEMENTED · TESTED` (mechanism `EXTERNALLY BLOCKED`)

`ingestFile` runs the §F.36 sequence: RAW FILE → PARSER → SCHEMA VALIDATION → EQUITY ELIGIBILITY
→ NORMALIZATION → DATA QUALITY → CANONICAL RECORD → RECONCILIATION → HISTORICAL STORE.
Idempotent (§F.42/43): a repeated source file is recognised and skipped; a restatement at a new
`dataVersion` updates the same canonical key and adds no row.

**Equity eligibility is default-deny**, because §F.39 is a *must-not*: a block-list would fail
open on any series NSE adds later. Verified exclusion of `N2`/`ND` (debt/NCD) and `GB`
(Sovereign Gold Bond) using series classes observed in real CM content.

---

## 9. CM-UDiFF compatibility — `IMPLEMENTED · TESTED`; exact column set `EXTERNALLY BLOCKED`

The parser is **header-driven by ISO tag**, never positional. This was a deliberate decision:
the authoritative NSE column *order* could not be verified from this environment, and §F.34
forbids inventing the contract. Binding by name is correct under any ordering and fails loudly
(E5) on a missing required tag.

Required tags: `TradDt, Sgmt, Src, ISIN, TckrSymb, SctySrs, ClsPric`. The legacy CM CSV format
is **detected and refused** (§F.35), with a test proving refusal.

⚠ **Before production:** the required-tag set must be reconciled against NSE's current **Format
Master catalogue**. This is an external documentation dependency, not a code change.

---

## 10. Historical backfill capability — `IMPLEMENTED · TESTED`

`planBackfill` supports explicit from/to, a default range, incremental and resume. Ten years
appears exactly once as `DEFAULT_BACKFILL_YEARS = 10` and only as an overridable default, so
§I.52 (no hard-coded permanent window) holds structurally. `runBackfill` reports `requested` and
`populated` as **separate objects** — a caller cannot accidentally report intent as coverage.

⚠ NSE market holidays are **not** encoded: no authoritative calendar exists in this repository,
and inventing one would mark real trading days as expected-absent. Every calendar day is a
candidate and a gap is reported as unavailable (§I.54).

## 11. Actual historical data loaded — **NONE**

**0 real records.** Fixtures are synthetic and labelled (§G.46/48). `syntheticUsed` is surfaced
by `runBackfill` so §I.56 is enforceable. **Ten years are NOT populated and are not claimed.**

## 12. 15-minute scheduler — `IMPLEMENTED · TESTED`

Provider-neutral, injected clock, `REFRESH_INTERVAL_MS = 15 × 60 × 1000` (§A.8). A skipped
schedule is **reported** (`missed`), not collapsed into one refresh. Retry: 3 attempts, fixed
backoff, no jitter. E1/E4/E7 retried; **E2/E3 not retried** (retrying cannot fix a licensing
gap and would mask it); E4/E7 escalate to E1 on exhaustion per P02:20/23.

## 13. Mock / reference adapter — `IMPLEMENTED · TESTED`

`r2-reference-file`, file-based, `isSynthetic: true`, self-describing as *"NOT an authorised NSE
acquisition mechanism"*. Fault injection covers every §E.32 condition. Selects current state by
**business date**, not filename sort order.

## 14. Data-quality controls — `IMPLEMENTED · TESTED`

Exactly three sinks — accept / reject / quarantine. There is no fourth path into the store, which
is how §J's "never silently accepted" holds structurally. Covers malformed, missing required,
invalid numeric, impossible OHLC, duplicates, unexpected symbols, non-equity, stale, missing
refresh, inconsistent timestamps, contradictory daily data.

⚠ **Real bug found and fixed:** an unparseable numeric (`NOT_A_NUMBER`) was normalized to `null`
and **accepted**, laundering a corrupt value into a legitimate-looking gap. `findInvalidNumerics`
now runs *before* normalization, which is the only point where absent and corrupt are still
distinguishable.

## 15. Reconciliation controls — `IMPLEMENTED · TESTED`

Row accounting (`source = accepted + rejected + quarantined + duplicate`), duplicate canonical
keys, source completeness (missing vs unexpected days), contradictory daily bars, timestamp
coherence. §J metrics reported on every run.

⚠ **Bug found and fixed:** `duplicateCount` was excluded from the accounting identity, so a
duplicate source row went unaccounted and reconciliation falsely balanced.

## 16. Persistence / migration changes — **NONE. §D.23 STOP CONDITION TRIGGERED** → `REQUIRES AUTHORITY DECISION`

Verified against the full repository (all 7 remote branches, 154-commit history):

- database/ORM dependencies in any `package.json` — **0 hits** (`pg`, `postgres`, `sqlite3`,
  `better-sqlite3`, `mysql2`, `mongodb`, `prisma`, `@prisma/client`, `typeorm`, `sequelize`,
  `knex`, `drizzle-orm`, `ioredis`, `redis`)
- migration directories — **0** · `.sql` files — **0** · schema files — **0**
- the only `migrat*` paths are `iips-platform/src/distributed/MigrationRuntime.ts` and its
  regression test — a **v1.1↔v2.0 runtime coexistence/rollback experiment**, not a DB migration
  framework

And an accepted decision **prohibits** adding one:
`docs/D22_F6_PHASE_08_IMPLEMENTATION_AUTHORIZATION.md`:139 — *"`p08/src/**` permitted, but **no
disk persistence** and ⚠ no network/credential access"*, with guard **M3** (`:177`) — *"`p08/src`
writes to disk → FAIL"*.

§D.21 is therefore unsatisfiable (nothing exists to use exclusively) and §D.22 presupposes a
first database that does not exist. **No persistence technology was introduced.** Instead the
`MarketDataStore` **port** is defined with an in-memory reference adapter explicitly labelled
`durable: false`. All R-2 logic is written against the port, so the durable implementation is a
drop-in substitution requiring no R-2 rewrite.

## 17. Security / secrets — `IMPLEMENTED · TESTED`

`SecretRef` carries a **name only**; `resolveSecret` deliberately does not exist, so no code path
can read, log or serialise a credential. §M.69/70 hold **structurally**, not by review
discipline. A test scans every shipping source file for credential-shaped literals. Nothing
hard-coded; nothing committed.

## 18–20. Branch, commits, PR

- **Branch:** `arena/01a0853c-iips-production-market-data` (the fixed Arena branch) — §18
- **Commit SHA:** see the commit record below — §19
- **PR:** **none created.** The established workflow for this branch is direct commit; §O.79
  forbids introducing a PR workflow merely because the prompt mentions PRs — §20

## 21. External provider / licensing status — `EXTERNALLY BLOCKED`

All six §L.66 gate items outstanding: acquisition mechanism authorised · credentials available ·
licensing in place · exchange/data entitlements granted · provider agreement executed ·
production access validated. Reported as **data** by `describeGate()`, not as prose.

## 22. Credential / entitlement requirements — `EXTERNALLY BLOCKED`

Modelled in `PRODUCTION_CONFIG_SHAPE`. Nothing provisioned. **No purchase made** (§L.63).

⚠ **§L.64/65 investigation (lowest-cost legally authorised route) was NOT performed.** It
requires NSE's current commercial terms and any single-user / non-commercial / waiver /
reduced-fee / delayed-data routes. That is external documentation this environment cannot
authoritatively retrieve, and guessing at pricing or entitlement terms would be worse than
stating the gap. Recorded as an open external dependency.

## 23. Exact remaining production work

1. Durable persistence decision (§16, §24) — **blocks** durable current-state and history storage.
2. NSE Format Master catalogue reconciliation of the required-tag set (§9).
3. Authorised acquisition adapter behind the existing port (§21).
4. NSE market-holiday calendar (§10).
5. Real ten-year EOD load + reconciliation (§11).
6. UI wiring on a UI-bearing branch (§5).

## 24. Exact remaining authority decisions

| # | Decision required |
|---|---|
| **AD-a** | **Persistence.** Either (a) authorise a specific durable technology + migration framework, expressly varying D22 §5's no-disk-persistence mandate for this scope; or (b) confirm market data stays in-memory/externally managed and R-2 consumes it read-only. **This is the single highest-value unblock.** |
| **AD-b** | **Integration branch** for UI wiring, given `frontend/` is absent from this branch. |
| **AD-c** | **Equity series allow-list** beyond `EQ`/`BE` (default-deny currently quarantines anything else). |
| **AD-d** | **§L.64/65 acquisition-mechanism investigation** — who performs it and against which authoritative NSE source. |
| **AD-e** | Whether `r2/` is the correct home for this workstream, given the repo's `p05`/`p06` phase-directory convention. |

## 25. Genuine blockers

1. **No persistence mechanism exists, and an accepted decision prohibits adding one** — §16, AD-a.
2. **No authorised NSE acquisition mechanism / credentials / entitlements** — §21.
3. **No UI on this branch** — §5.

None of these blocked provider-neutral engineering; §S was honoured throughout.

## 26. Recommended next executable action

**Resolve AD-a (persistence).** Everything else in §23 is downstream of it: a durable
current-state store, the historical store and real backfill all depend on a persistence decision
that §D.23 forbids making silently. Until then R-2 runs correctly and testably against the
in-memory reference adapter, and no production capability is claimed.

---

## Appendix — honest deviations and defects found during implementation

| # | Finding | Resolution |
|---|---|---|
| 1 | `freshness` declared REQUIRED rejected every EOD bar | Made optional; it is a property of the current-state view, not an immutable bar (INV-2) |
| 2 | Unparseable numeric laundered into `null` and **accepted** | `findInvalidNumerics` runs before normalization |
| 3 | `duplicateCount` omitted from §J accounting identity | Identity extended; duplicate counted |
| 4 | `providerError` validated against taxonomy **keys** not **values** | `isTaxonomyCode()` added; all error paths were throwing instead of returning |
| 5 | Refresh result read `metrics.accepted` (nonexistent) — all counts silently 0 and PARTIAL unreachable | Corrected to `…Count`; PARTIAL now reachable |
| 6 | Reference adapter picked "current" by filename sort, and truncation applied only on the EOD path | Business-date selection; truncation on both paths |
| 7 | `priceCurrency` emitted but undeclared in the contract | Declared as a required enum |

Every one of these was caught by a **test**, not by review. Items 2, 3, 4 and 5 were silent
failures — they would have produced plausible-looking output.
