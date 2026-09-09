# P05-01 — LOCAL DETERMINISTIC MARKET FEED — SPECIFICATION

**Phase:** P05 — Market Data Acquisition & Ingestion · **Item:** **P05-01** (tracker `Work Tracker`!P05-01)
**Status:** **IMPLEMENTED AND EVIDENCED** — ⚠ **P05 is NOT ACCEPTED**
**Authorization:** `docs/d9/D9_P05_ENTRY_AUTHORIZATION.md` §3 **A-1 — P05-01 FULL**
**Baseline:** `efe33eae287d2181cfdd5a838b0d9e5112fcdad3` — *"CHECKPOINT-03: post-P04 / OI-10 resolved / pre-P05 boundary"*
**Certification:** `NONE_GRANTED` · **Production activation:** `NOT_AUTHORIZED`

> ## ⚠ THIS IS NOT P05 ACCEPTANCE
>
> **P05 ENTRY/AUTHORIZATION = AUTHORIZED · P05 ACCEPTANCE = NOT_ACCEPTED ·
> CERTIFICATION = NONE_GRANTED · PRODUCTION ACTIVATION = NOT_AUTHORIZED.**
>
> There is **no `P05_GATE_ACCEPTANCE.md`** and none is created by this package. Gate rule
> (tracker `Phase Gates`!P05): *"Explicit gate acceptance; no automatic promotion."*

---

## 1. Scope — exactly what D9 §3 A-1 authorized

| # | Authorized by A-1 | Where satisfied |
|---|---|---|
| 1 | **Specification** | This document |
| 2 | **Adapter conformance** | `p05/src/localFeed.js` (A-1…A-25, B-1…B-6, D-1…D-6, S-1…S-9) · `tests/no-provider-dependency.test.js` |
| 3 | **Fixture design and construction** | `p05/fixtures/*.json` · `evidence/01-fixture-manifest.json` |
| 4 | **Provenance / `asOf` / version handling** | `p05/src/contract.js`, `p05/src/localFeed.js` · `evidence/04`, `evidence/05` |
| 5 | **Deterministic replay and idempotency** | `p05/src/replay.js` · `evidence/06`, `evidence/07` |
| 6 | **Negative and error-contract work** | `p05/src/errors.js`, `p05/src/validate.js` · `evidence/08` |

### 1.1 Explicitly NOT in scope (D9 §3.1)

| # | Not authorized | Status here |
|---|---|---|
| **N-1** | **P05-02 live provider execution** | **NOT PERFORMED** — no network, no authentication, no provider |
| **N-2** | **P05-03 licensed / deeper historical acquisition** | **NOT PERFORMED** — one `1D` granularity, a 3-bar synthetic fixture |
| **N-3** | **P05-04 ingestion orchestration** | **NOT IMPLEMENTED** — no scheduler, no retry policy, no checkpointing |
| **N-4** | Per-record tenant/region governance application | **NOT IMPLEMENTED** — OI-P04-03 OPEN, IB-1…IB-5 |
| **N-5** | Inventing / defaulting the governance attribute set | **NOT DONE** — no attribute invented |
| **N-6** | Inventing domain-segment labels | **NOT DONE** — see `P05_01_OPEN_ITEMS.md` §2 |
| **N-7** | `<NS>` → `MD:` rewriting of accepted P01/P02 records | **NOT DONE** — those records stand unedited |

---

## 2. Architecture

```
p05/fixtures/*.json          provider-native synthetic payloads + P04-shaped identity fixtures
        │                    (B-1: provider-native shapes exist ONLY here and inside the adapter)
        ▼
p05/src/localFeed.js         LocalDeterministicMarketFeed
        │                    · declareCapability()  A-1…A-8   (static, no I/O)
        │                    · preflight()          A-10 / E6  (before any acquisition)
        │                    · assertSourceAvailable()  E1     (only quality-bearing class)
        │                    · assertWireShape()    A-13 / E5  (declared provider schema)
        │                    · map*()               A-14 / E8  (provider-native → canonical)
        │                    · buildKey()           A-15       (MD:<domain>.<field>)
        │                    · buildSnapshot()      A-16       (immutable, versioned, frozen)
        ▼
p05/src/contract.js          CanonicalSnapshot / CanonicalField  (P01 §3.1, §3.2)
p05/src/namespace.js         OI-10 token + ADR-01 C1–C6 collision guard
p05/src/validate.js          S1 structural → S2 namespace → S3 semantic → S4 referential → S5 quality
p05/src/errors.js            E1–E8 taxonomy + F-1…F-11 failure records
p05/src/serialize.js         deterministic canonical serialization + exact decimals
p05/src/identity.js          P04-shaped mapping register, FC-1…FC-7 fail-closed
p05/src/replay.js            LOCAL canonical record store (⚠ NOT the existing-IIPS ReplayService)
        │
        ▼
MarketDataSource<T> → DataSnapshot<T>     ← the sole ingress boundary (INV-1 / AD-2, B-4)
```

⚠ **INV-1 / AD-2 preserved.** `LocalDeterministicMarketFeed.source` exposes exactly one
`MarketDataSource`-shaped boundary with a single `snapshot(request)` method. No second ingress
contract is created.

---

## 3. Contracts implemented, with their authority

| Contract | Source | Implementation |
|---|---|---|
| `snapshotId` = `data-${provider}-${dataVersion}-${asOf}`, frozen | SI-1, SI-4, S-2, ST-2, AD-6 | `contract.js buildSnapshotId`, `assertSnapshotIdConsistent` |
| 16-slot canonical envelope | `P01_DATA_CONTRACT.md` §3.1 | `contract.js buildSnapshot` |
| 13-slot canonical field | `P01_DATA_CONTRACT.md` §3.2 | `contract.js buildField` |
| Deep immutability | SN-1, ST-10, A-22, INV-2 | `contract.js deepFreeze` |
| `availability` enum, no coercion | NL-1…NL-7 | `contract.js`, `validate.js` |
| Quality enum unchanged, propagated | Q-1…Q-6 | `validate.js classifyQuality` |
| **OI-10 token `MD:`, form `MD:<domain>.<field>`** | `CHECKPOINT-03.md`:75–77 | `namespace.js` |
| **ADR-01 C1–C6 fail-closed** | `CHECKPOINT-03.md` §3.2 · `P01_VALIDATION_RULES.md` §3 | `namespace.js assertC1…assertC4`, `assertCollisionGuard` |
| Domain-segment vocabulary | `P01_FIELD_DICTIONARY.md` §3–§12 | `namespace.js DOMAIN_SEGMENTS` |
| Validation stages S1–S5 | `P01_VALIDATION_RULES.md` §1–§8 | `validate.js` |
| Rejection evidence RJ-4 | `P01_VALIDATION_RULES.md` §7 | `validate.js rejectionEvent` |
| Error taxonomy E1–E8 | `P02_ERROR_TAXONOMY.md` §1–§5 | `errors.js` |
| Failure record F-1…F-11 | `P02_ERROR_TAXONOMY.md` §5 | `errors.js failureRecord` |
| Adapter obligations A-1…A-25 | `P02_PROVIDER_ABSTRACTION_CONTRACT.md` §3 | `localFeed.js` |
| Determinism D-1…D-6 | `P02_PROVIDER_ABSTRACTION_CONTRACT.md` §4 | `localFeed.js`, `serialize.js` |
| Six version axes | `P02_PROVIDER_IDENTITY_VERSIONING.md` §2.1, VX-1…VX-4 | `localFeed.js`, evidence `05` |
| Lineage L-1…L-11 | `P01_IDENTITY_AND_LINEAGE.md` §4 | `localFeed.js buildLineage` |
| Provider register PG-1…PG-5 (**DEP-P02-04**) | `P02_PROVIDER_IDENTITY_VERSIONING.md` §5 | `fixtures/provider-register.json` |
| Canonical identity CS-1…CS-6 | `P04_CANONICAL_SECURITY_MODEL.md` | `fixtures/identity-fixtures.json` |
| **OI-08 = 1:N** MC-1…MC-7 | `P04_IDENTITY_ADAPTER_CONTRACT.md` §4 | `identity.js MappingRegister` |
| **OI-09 = FIGI/OpenFIGI** XI-1…XI-8 | `P04_CANONICAL_SECURITY_MODEL.md` | `identity.js` |
| Mapping provenance MP-1…MP-5 | `P04_IDENTITY_ADAPTER_CONTRACT.md` §5 | `identity.js validateMappingRecord` |
| Provider neutrality PN-1…PN-6 | `P04_IDENTITY_ADAPTER_CONTRACT.md` §3 | `identity.js` |
| **Fail-closed FC-1…FC-7** | `P04_IDENTITY_ADAPTER_CONTRACT.md` §6 | `identity.js IdentityResolutionFailure` |
| MIC-based venue VN-1…VN-5 | `P04_EXCHANGE_VENUE_REFERENCE.md` | `localFeed.js mapVenue` |
| Six lineage axes, no seventh (VA-1) | `P04_LINEAGE_AND_VERSION_IMPACT.md` | `localFeed.js` |
| `identityMappingVersion` in lineage, not `snapshotId` (SN-2) | `P04_LINEAGE_AND_VERSION_IMPACT.md` | `contract.js`, `localFeed.js` |
| Never conflated with `SNAP_*` (SN-4, SN-5) | `P04_LINEAGE_AND_VERSION_IMPACT.md` | asserted in `tests/provenance.test.js` |
| Exact decimals, no silent rounding (NP-1…NP-5) | `P01_TIMESTAMP_CURRENCY_UNIT_RULES.md` §6 | `serialize.js canonicalDecimal` |
| ISO-8601 UTC fixed precision (TS-1…TS-6) | `P01_TIMESTAMP_CURRENCY_UNIT_RULES.md` §1 | `serialize.js assertIsoUtc` |
| Currency ISO-4217 (CU-1…CU-7) | `P01_TIMESTAMP_CURRENCY_UNIT_RULES.md` §4 | `localFeed.js assertCurrency` |
| Adjusted/unadjusted both retained (AJ-1…AJ-5) | `P01_TIMESTAMP_CURRENCY_UNIT_RULES.md` §7 | `localFeed.js mapOhlcv` |

**No identity rule is invented.** Every identity, cardinality, identifier-standard, lifecycle,
venue, lineage and namespace behaviour above is implemented from an accepted P01/P02/P04
artifact and is asserted against that artifact's rule IDs in the test suite.

---

## 4. Determinism guarantees

| # | Guarantee | Mechanism |
|---|---|---|
| 1 | No wall-clock input | `receivedAt` is supplied by the caller; no `Date.now()` / `new Date()` anywhere in `p05/src/` (asserted) |
| 2 | No randomness | No `Math.random` / `randomUUID` (asserted) |
| 3 | No ambient state | No `process.env` (asserted) |
| 4 | No network | No `node:http`/`https`/`net`/`tls`/`fetch`; suite runs with `fetch` made to throw |
| 5 | No dependencies | `package.json` declares `dependencies: {}` and `devDependencies: {}`; no lockfile, no `node_modules` |
| 6 | Canonical ordering | Keys sorted ascending at every level (`serialize.js canonicalJson`, `namespace.js canonicalKeyOrder`) |
| 7 | Exact numerics | Decimals carried as fixed-scale strings; NP-3 refuses silent rounding |
| 8 | Fixed timestamps | ISO-8601 UTC at millisecond precision, asserted, never reformatted |
| 9 | Reproducible evidence | `npm run evidence` is byte-identical across runs (verified) |

---

## 5. What this package does NOT do

| # | Not done |
|---|---|
| 1 | Accept P05, or create `P05_GATE_ACCEPTANCE.md` |
| 2 | Grant certification — **C1–C12 remain `NONE_GRANTED`** |
| 3 | Authorize production activation |
| 4 | Promote P06, P07 or P08 — all remain NOT_STARTED |
| 5 | Select or name a market-data provider |
| 6 | Provision a credential, secret or endpoint |
| 7 | Resolve **OI-P04-04** (FIGI sourcing/licensing/coverage) |
| 8 | Resolve **OI-P04-03** (tenant/region governance attribute set) |
| 9 | Alter OI-08, OI-09, OI-10 or ADR-01 C1–C6 |
| 10 | Modify accepted P01/P02/P04 contracts or any gate-acceptance record |
| 11 | Touch existing-IIPS source, methodology, scoring, calibration or certified contracts |
| 12 | Touch `ReplayService`, `DataBoundExecutor`, `LiveDataRuntime.ts` — **AD-17 remains UNRESOLVED** |
| 13 | Modify the tracker XLSX or SPEC DOCX (AD-14 corrections remain specified, not applied) |
| 14 | Introduce a new engine metric key (INV-8) |
| 15 | Claim replay verification is adequate — lineage sufficiency and replay verification are independent concerns |

---

## 6. Running it

```bash
cd p05
npm test          # 118 tests, node:test built in, zero dependencies
npm run evidence  # regenerate p05/evidence/ deterministically
```

Node ≥ 20. No install step: there are no dependencies.

---

## 7. Gate position

**P05 is NOT accepted by this package.** The evidence in `p05/evidence/` and
`docs/p05/P05_01_EVIDENCE.md` is the P05-01 portion of what eventual P05 acceptance will
require — see `P05_01_EVIDENCE.md` §4 for what remains outstanding.
