# P05-03 — HISTORICAL OHLCV INGESTION CONTRACT (specification / adapter-contract package)

| | |
|---|---|
| **Unit** | **P05-03-A** — historical OHLCV ingestion contract (`HA-*`) |
| **Date** | 2026-09-09 |
| **Authorization** | `docs/d9/D9_P05_ENTRY_AUTHORIZATION.md` §3 **A-3** |
| **Scope granted** | *"Specification and adapter-contract only — historical OHLCV ingestion contract, reproducibility and load/reconcile requirements."* |
| **Scope withheld** | ⚠ **N-2** — *"No licensed or deeper historical acquisition"* (**OI-P04-04**) |
| **Baseline** | `efe33eae287d2181cfdd5a838b0d9e5112fcdad3` (CHECKPOINT-03) |
| **Contract** | **`P05-03-HISTORICAL-OHLCV-INGESTION-CONTRACT` v1.0** · **35 rules `HA-1…HA-35`** |
| **Module** | `p05/src/historicalAdapterContract.js` |
| **Gate status** | **P05 = AUTHORIZED / NOT_ACCEPTED** · still **5 of 18** · **no `P05_GATE_ACCEPTANCE.md`** |

> ⚠ **READ THIS FIRST.** This is a **specification and an adapter contract**. It is **not** an
> adapter, it acquires nothing, and it proves nothing about real historical data. **The tracker
> exit criterion *"Historical load reproducible"* and evidence column *"Historical sample"* both
> remain UNMET.** No provider was selected, named, contacted or bound. No credential was
> provisioned. No licensed data was acquired. `mockhist` is a **synthetic test double** and is
> **not** a provider-register issuance.

---

## 1. The four-layer distinction

| Layer | What | Authorized | Authority |
|---|---|---|---|
| **ADAPTER_SPECIFICATION** | This document | ✅ | **D9 A-3** |
| **ADAPTER_CONTRACT** | `historicalAdapterContract.js` + tests | ✅ | **D9 A-3** |
| **PROVIDER_SPECIFIC_CONFIGURATION** | Real provider identity, endpoint, schema binding, entitlement values, credentials, licensed depth | ❌ | **D9 N-2** — OI-P04-04 OPEN; provider selection **NONE MADE**; entitlement matrix **EMPTY** (INV-10); credentials **NONE**; **P16** authority not held |
| **LICENSED_HISTORICAL_EXECUTION** | Acquiring licensed/deeper historical data; a real historical sample | ❌ | **D9 N-2** |
| **ORCHESTRATION** | Scheduling, retry execution, checkpointing, batch infrastructure | ❌ | **D9 N-3** — P05-04 |
| **STORAGE_AND_ADJUSTMENT** | Series storage, PIT storage/query, adjusted-series generation, adjustment engine | ❌ | **P08** — PC-6, RC-5, **DEP-P01-04** |

---

## 2. The series-structure boundary (`HA-3`) — the single most important constraint here

`P01_SCHEMA_CATALOG.md` D02 records:

> ⚠ **Contract note** — `DataSnapshot.asOf` is a **single scalar**, not a series. A series is
> delivered as an ordered set of snapshots or as a snapshot whose `T` carries a bounded series —
> **structure choice is a P08 storage decision**, recorded here as **DEP-P01-04**, not resolved.

The accepted **P05-01 precedent is one bar per snapshot** (`localFeed.js mapOhlcv()`). P05-03
**reuses** that precedent, because keeping `asOf` scalar means it **does not pre-empt** the P08
decision. `HA-3` encodes this and `SERIES_STRUCTURE_CONTRACT` asserts:

| | |
|---|---|
| `representation` | `ORDERED_SEQUENCE_OF_PER_BAR_SNAPSHOTS` |
| `barsPerSnapshot` | **1** |
| `asOfIsScalar` | **true** |
| `resolvesDepP01_04` | **false** — owner **P08**, status **UNRESOLVED** |
| `seriesStorageModelDefined` / `pitStorageDefined` / `pitQueryDefined` | **false / false / false** |

> ⚠ **Reusing the precedent must not be read as resolving DEP-P01-04.** No series-carrying
> snapshot shape, no series-storage model and no PIT-query surface is defined anywhere in P05-03.

---

## 3. What is reused rather than reinvented

| Reused from | What |
|---|---|
| **P02 B-4 / AD-2** | `snapshot(request)` is the **sole** public ingress. The nine phases are *internal*. |
| **P05-02 `LA-4`** | Gate order **capability → entitlement → authentication → acquisition**, reproducing `CLASSIFICATION_GATE_ORDER` (`E6→E3→E2→E1`) — **not invented** |
| **P02 E1–E8** | The error taxonomy. **`HA-5`: a historical contract adds NO class** (FC-6 analogue) |
| **P05-01 canonical surface** | `buildSnapshot`, `validateSnapshot`, `buildKey`, C1–C6 guards, `canonicalDigest`. `CANONICAL_OUTPUT_BOUNDARY` asserts **`forked: false`** |
| **P01 ST-2 / INV-2** | `snapshotId = data-${provider}-${dataVersion}-${asOf}` — **no component added** |
| **P01 §4** | The D02 `ohlcv.*` field set, verbatim |
| **P04 LC-1…LC-6** | Lifecycle rules, verbatim |

---

## 4. The 35 rules

### 4.1 Identity, versioning, phase shape (`HA-1…HA-5`)

| # | Rule |
|---|---|
| **HA-1** | The contract is versioned (mirrors **AV-3 / AV-4 / AV-5**) |
| **HA-2** | Two provider kinds. The historical surface is required **only** for `LIVE`; a `LOCAL_FIXTURE` adapter is permanently out of scope for licensed acquisition |
| **HA-3** | ⚠ **One bar per snapshot, scalar `asOf`, `DEP-P01-04` UNRESOLVED** (§2) |
| **HA-4** | Gate order reproduced, not invented |
| **HA-5** | **No new error class.** E1–E8 reused unchanged |

### 4.2 Historical capability declaration (`HA-6…HA-15`)

| # | Rule |
|---|---|
| **HA-6** | ⚠ **Granularity is DECLARED and VERSIONED, not enumerated.** `P01_FIELD_DICTIONARY` §4 types `barInterval` as an `enum` but **never lists values**. **`1D` is the only authorized value.** `1H/5M/15M/1W/1M/3M/1Y` are **prohibited here** (**D9 N-6** — labels are enumerated by authority, not derived). Analogue of **LA-31 / BD-P05-02-05** |
| **HA-7** | **PIT capability per PC-1…PC-6.** A claim must state earliest boundary, boundary granularity, and whether publication/effective time are separately preserved. **PC-2: depth ≠ PIT.** **PC-6: PIT storage is P08** |
| **HA-8** | Revision capability per **RC-1…RC-2** |
| **HA-9** | ⚠ **D02 is NOT restatement-bearing.** RC-2 enumerates **D03, D07, D08** only. An OHLCV correction is an **ADJUSTMENT** (D04 / AJ-1…AJ-3), never a restatement |
| **HA-10** | Adjustment per **RC-3…RC-5**. **RC-4:** factors are evidence-bearing, never silently applied. **RC-5: the adjustment engine is P08** |
| **HA-11** | The declaration is static, I/O-free (**CD-1**), canonical-only (**CD-4**), with **no endpoint, hostname, account or credential** (**SP-2 / A-23**) |
| **HA-12** | `entitlementRequirements` / `credentialRequirements` are **requirements**, not grants, not values (**CD-6**; **INV-10** matrix EMPTY) |
| **HA-13** | `historicalRanges[]` must be **bounded** and may declare **gaps** explicitly (P02 §6: *"Partial history → Bounded/gapped `historicalRanges[]`"*) |
| **HA-14** | Conformance returns a **violation list**; it never throws for a content shortfall — the shortfall *is* the finding |
| **HA-15** | A historical OHLCV adapter must declare **D02** |

### 4.3 Range, gaps, load identity (`HA-16…HA-18`)

| # | Rule |
|---|---|
| **HA-16** | **Requested vs supported range.** **UC-2** prohibits silent narrowing, substituting a nearer granularity or nearer as-of, and fallback. An out-of-range request **fails E6** — it is **never clipped** |
| **HA-17** | **A gap is first-class content.** `NOT_PROVIDED` at bar level + a declared gap bound at range level. **Never** zero, empty string, carried-forward value, omission, or a lower `quality` value |
| **HA-18** | **Load identity is the ordered digest of its per-bar snapshot identities.** ⚠ **No third identity layer** (**SN-4/SN-5**). It is never an input to `snapshotId` |

### 4.4 Reproducibility and corrections (`HA-19…HA-22`)

| # | Rule |
|---|---|
| **HA-19** | **PC-3 — same boundary ⇒ same result ⇒ same snapshot identity**, with **D-1** as the mechanism. ⚠ **CONTRACT_VALIDATION only**; it does **not** satisfy the tracker exit criterion |
| **HA-20** | **PC-4 + ED-5/MP-3** — corrections are **additive**; a past boundary result is never retroactively altered |
| **HA-21** | **AJ-1 / AJ-3 / SM-11 / L-11 / RC-4** adjustment-declaration conformance. Disposition **REJECT** per **SM-11**. ⚠ Validates a **declaration**; computes nothing (**RC-5**) |
| **HA-22** | **LC-2 / LC-3 / LC-6** identity stability across a load |

### 4.5 Completeness, absence, failure, retry (`HA-23…HA-27`)

| # | Rule |
|---|---|
| **HA-23** | ⚠ **The reconciliation record requires a declared `expectedBarCountBasis`.** The contract does **NOT invent a trading calendar** — a completeness figure computed from an invented calendar would be a fabricated number |
| **HA-24** | **Reconciliation never silently reconciles** — `REPORT_ONLY`. No auto-fill, no interpolation, no carry-forward |
| **HA-25** | Absence semantics reuse the accepted **AVAILABILITY** enumeration **unchanged** — P05-03 adds no historical-specific absence state |
| **HA-26** | Error mapping reuses **E1–E8**; **no class added** |
| **HA-27** | Retry **contract-level only**; retryable `E4, E7` (unchanged). ⚠ **Execution is P05-04** (**D9 N-3**) |

### 4.6 Boundary and attestation (`HA-28…HA-35`)

| # | Rule |
|---|---|
| **HA-28** | The canonical boundary is the **P05-01 surface, re-exported verbatim** — **`forked: false`** |
| **HA-29** | The D02 field set is the **accepted P01 dictionary**; **no vocabulary added** |
| **HA-30** | Observability reports **inputs**; it sets **no threshold** (**MQ-1** — thresholds are **P07**) |
| **HA-31** | `receivedAt` is taken from the request, never recomputed (**D-4 / TS-6**) |
| **HA-32** | The **authorization matrix** (§1) |
| **HA-33** | **No orchestration** — scheduling, retry execution, checkpointing and batch infrastructure are **P05-04** |
| **HA-34** | **No tenant/region attribute**, no default, no inference (**D9 N-4/N-5**, **OI-P04-03**, **IB-1…IB-5**) |
| **HA-35** | `contractSummary()` attests every boundary claim as **false** |

---

## 5. Error mapping (`HA-26`)

| Scenario | Class |
|---|---|
| Granularity not declared | **E6** (CE-4) |
| Range exceeds declaration | **E6** (UC-2 / CE-5) |
| Domain outside capability | **E6** (CE-1) |
| Unentitled historical depth | **E3** (EV-3 default deny) |
| Authentication failure | **E2** |
| Source unreachable | **E1** — the **only** quality-bearing class |
| Rate limited / transient | **E7 / E4** |
| Payload shape violation | **E5** |
| Unmappable identity or unit | **E8** |
| Identity unresolved | **E8** + **FC-1…FC-7** — explicit, deterministic, named, **not** a quality state |
| **Missing bar** | ⚠ **NOT a failure** — `NOT_PROVIDED` + a declared gap (**HA-17**) |

---

## 6. What was explicitly **not** done

| Not done | Authority |
|---|---|
| No provider selected, named, contacted or bound | D9 N-2 |
| No credential, API key, endpoint, vendor SDK | SP-2 / A-23 |
| No network call, no live execution | D9 N-2 |
| No licensed or deeper historical acquisition; **no real historical sample** | D9 N-2 / OI-P04-04 |
| No adjusted-series generation; no adjustment engine; no corporate-action processing | **P08 / RC-5** |
| No series storage, no PIT storage, no PIT query | **P08 / PC-6 / DEP-P01-04** |
| No new `barInterval` value | **HA-6 / D9 N-6** |
| No scheduling, retry execution, checkpointing, batch infrastructure | **P05-04 / D9 N-3** |
| No tenant or region attribute, no default | **D9 N-4/N-5 / IB-1…IB-5** |
| No P05 acceptance, no certification, no activation | — |
| No P06/P07/P08 work | — |

---

## 7. Two disclosures

### 7.1 ⚠ One existing test was scoped — not weakened

`p05/tests/no-provider-dependency.test.js` asserted that P05-01 implementation modules must
**never even name** "retry", and excluded only `liveAdapterContract.js` from that rule — because
that was the only contract module in existence. Its own comment states the underlying principle:
*a contract module may **classify** retryability but may not **implement** a retry policy.*

`historicalAdapterContract.js` is in exactly that category (**D9 A-3** authorizes
error-taxonomy work), so the same carve-out was extended to it.

**This is not a weakening.** The identical behavioural assertions already applied to the P05-02
contract module — no backoff, no retry loop, no attempt counter, no wait primitive — are now
applied to the P05-03 module **as well**, and `historical-adapter-contract.test.js` **HA/19**
asserts them again independently. The **P05-01 implementation set keeps the strict rule
unchanged**, and **no P05-01 assertion was altered**.

### 7.2 ⚠ Two keys were shortened to satisfy the A-23 secret scanner

`scanForSecrets` matches `["'][A-Za-z0-9+/]{40,}={0,2}["']` and scans JSON **whole**, so a 40+
character camelCase identifier is indistinguishable from a base64 blob. Two P05-03 keys were
therefore shortened:

| From | To | Meaning |
|---|---|---|
| the fully expanded 45-char PC-1 key | `pubAndEffTimeSeparatelyPreserved` | **unchanged** (PC-1) |
| the fully expanded 44-char attestation key | `claimsRealDataLoadReproducible` | **unchanged** — still reads `false` |

⚠ **The P05-01 scanner was NOT modified** — P05-01/P05-02 behaviour is unchanged. Recorded as
**BD-P05-03-10**.

---

## 8. Gate position — unchanged

| | |
|---|---|
| **P05** | **AUTHORIZED / NOT_ACCEPTED** — still **5 of 18** gates accepted |
| **P05-01** | IMPLEMENTED / EVIDENCED |
| **P05-02** | SPECIFICATION + ADAPTER-CONTRACT COMPLETE · live execution NOT AUTHORIZED |
| **P05-03** | **SPECIFICATION + ADAPTER-CONTRACT COMPLETE (P05-03-A)** · **licensed acquisition NOT AUTHORIZED** |
| **P05-04** | **NOT AUTHORIZED** (D9 N-3) |
| `P05_GATE_ACCEPTANCE.md` | **DOES NOT EXIST — not created** |
| **Certification** | `NONE_GRANTED` |
| **Production activation** | `NOT_AUTHORIZED` |
| **P06 / P07 / P08** | **NOT STARTED / NOT PROMOTED** |

`Phase Gates!P05` defines **one** acquisition gate spanning P05-01…P05-04, promoted only by
**"Explicit gate acceptance; no automatic promotion."** No acceptance act was performed here, and
the **A3 gate acceptor remains UNKNOWN**.
