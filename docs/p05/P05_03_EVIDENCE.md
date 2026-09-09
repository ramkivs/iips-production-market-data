# P05-03 — EVIDENCE RECORD (historical OHLCV ingestion contract)

| | |
|---|---|
| **Unit** | **P05-03-A** — historical OHLCV ingestion contract (`HA-1…HA-35`) |
| **Date** | 2026-09-09 |
| **Authorization** | `docs/d9/D9_P05_ENTRY_AUTHORIZATION.md` §3 **A-3** — specification / adapter-contract only |
| **Baseline** | `efe33eae287d2181cfdd5a838b0d9e5112fcdad3` (CHECKPOINT-03) |
| **Evidence class** | **`CONTRACT_VALIDATION`** |

> ⚠ **WHAT THIS EVIDENCE IS, AND WHAT IT IS NOT.**
>
> It evidences that the P05-03 historical-ingestion **boundary is defined and locally testable**.
> It is **NOT**:
> - a **real historical sample** (tracker `Work Tracker!P05-03` *"Evidence"*) → **UNMET**
> - **load/reconcile testing against real data** (tracker *"Test / Validation"*) → **UNMET**
> - proof that ***"Historical load reproducible"*** holds for licensed data (tracker *"Exit
>   Criteria"*) → **UNMET**
>
> All three require licensed acquisition, which **D9 N-2** does not authorize and **OI-P04-04**
> blocks. Every evidence file carries that classification, not just this one.

---

## 1. Contract version and interface

| | |
|---|---|
| **Contract ID** | `P05-03-HISTORICAL-OHLCV-INGESTION-CONTRACT` |
| **Version** | **1.0** |
| **Rules** | **35** (`HA-1…HA-35`), numbering contiguous from 1 |
| **`ruleCount` verified against source** | ✅ documented **35** = declared **35** (test **HA/1**) |
| **Phases** | `declare → preflight → entitlement → authenticate → fetch → normalize → map → validate → emit` |
| **Sole ingress** | `snapshot(request)` — **P02 B-4 / AD-2**; the phases are internal |
| **Gate order** | `E6 → E3 → E2 → E1` — **reproduced** from `CLASSIFICATION_GATE_ORDER`, not invented |
| **Error classes** | `E1…E8` · **additions: none** |

---

## 2. Test result

**`cd p05 && npm test` → `# tests 228 · # pass 228 · # fail 0`**

| File | Tests | Pass | Fail |
|---|---|---|---|
| **`historical-adapter-contract.test.js`** *(new — P05-03)* | **28** | **28** | **0** |
| `adapter-contract.test.js` | 82 | 82 | 0 |
| `identity-collision.test.js` | 24 | 24 | 0 |
| `negative.test.js` | 21 | 21 | 0 |
| `namespace.test.js` | 15 | 15 | 0 |
| `no-provider-dependency.test.js` | 14 | 14 | 0 |
| `provenance.test.js` | 13 | 13 | 0 |
| `determinism.test.js` | 12 | 12 | 0 |
| `existing-iips-boundary.test.js` | 11 | 11 | 0 |
| `replay-idempotency.test.js` | 8 | 8 | 0 |
| **Total** | **228** | **228** | **0** |

**Suite 200 → 228.** All 200 pre-existing tests still pass.

| Test | Establishes |
|---|---|
| **HA/1** | Contract versioned; **`ruleCount` equals the documented rule count** — not inflated |
| **HA/2** | Nine-phase shape preserved; gate order **reproduced**; one ingress |
| **HA/3** | ⚠ One bar per snapshot, scalar `asOf`, **DEP-P01-04 UNRESOLVED**, no PIT storage/query |
| **HA/4** | Capability declaration conforms — **24 checks, 0 violations**; no URL in the declaration |
| **HA/5** | Entitlement/credential entries are **requirements**, never values (INV-10) |
| **HA/6** | ⚠ **`1D` only**; `1H/5M/15M/1W/1M/3M/1Y` prohibited; an invented interval **fails HA-6** |
| **HA/7** | `historicalRanges[]` must be **bounded**; unbounded and absent both fail |
| **HA/8** | **PC-1…PC-6 / RC-1…RC-5 / HA-9**; an incomplete PIT claim fails **PC-1** |
| **HA/9** | Requested vs supported range; **UC-2** — nothing is ever clipped |
| **HA/10** | A gap is first-class; prohibited substitutes enumerated |
| **HA/11** | Load identity is a derived digest — **no third identity layer** |
| **HA/12** | **PC-3** reproducibility — `CONTRACT_VALIDATION`, tracker **not** satisfied |
| **HA/13** | **PC-4 + ED-5/MP-3** — corrections additive, never retroactive |
| **HA/14** | **AJ-1 / AJ-3 / SM-11 / RC-4 / RC-5** adjustment declarations |
| **HA/15** | **LC-2 / LC-3 / LC-6** identity stability |
| **HA/16** | **HA-23/HA-24** reconciliation — `REPORT_ONLY`, declared basis mandatory |
| **HA/17** | Absence vocabulary **unchanged** |
| **HA/18** | E1–E8 reused; **no class added** |
| **HA/19** | Retry contract-level only; **no loop/timer/counter in the module** |
| **HA/20** | Canonical boundary **`forked: false`** — same function objects as P05-02 |
| **HA/21** | D02 field set is the accepted dictionary; `sessionRef` **not** emitted |
| **HA/22** | Observability sets no threshold; `receivedAt` never recomputed |
| **HA/23** | Authorization matrix — spec + contract only |
| **HA/24** | No orchestration, no tenant/region attribute |
| **HA/25** | **12 attestation flags all `false`** |
| **HA/26** | Determinism — 5 evaluations → 1 digest |
| **HA/27** | Module purity — no net module, no dynamic require, no clock, no URL |
| **HA/28** | **Non-regression**: P05-01 D02 emission unchanged and matches the HA-3 precedent |

**Load-bearing proof:** injecting three faults — `ruleCount 35→99`, `resolvesDepP01_04 false→true`,
`licensedAcquisitionPerformed false→true` — made **4 tests fail** (HA/1, HA/3, HA/4, HA/25).
Restored → 28/28. The tests are not vacuous.

---

## 3. Capability declaration and conformance

**24 checks, 0 violations.** Negative checks (each must be **rejected**):

| Check | Rejected | Rule cited |
|---|---|---|
| Granularity `1H` added | ✅ | **HA-6** |
| Unbounded `historicalRange` | ✅ | **HA-13** (`BOUNDED`) |
| `historicalRanges: []` | ✅ | **HA-13** |
| PIT claim missing a **PC-1** element | ✅ | **PC-1** |

Test double: `mockhist`, `_status: SYNTHETIC_TEST_DOUBLE`, `_registeredInProviderRegister: false`.
⚠ **Not a provider-register issuance** — the register still holds exactly one identity (`localfix`).

---

## 4. Range semantics (`HA-16`)

**5 scenarios, all matched, none clipped.**

| Fixture | Request | Supported | Violation |
|---|---|---|---|
| HR-0001 | `D02/1D` inside declared range | ✅ | — |
| HR-0002 | `D02/1D` strict sub-range | ✅ | — |
| HR-0003 | `D02/1D` from `2026-01-01` — exceeds range | ❌ | **UC-2** |
| HR-0004 | `D02/1H` — unauthorized interval | ❌ | **CE-4 / HA-6** |
| HR-0005 | `D03/1D` — outside capability | ❌ | **HA-13** |

⚠ `clipped` is **`false` in every case**. The contract never narrows a request to whatever happens
to be available (**UC-2**).

---

## 5. Load / reconcile behaviour demonstrated (`HA-17`, `HA-23`, `HA-24`)

| | |
|---|---|
| Requested bar dates | `2026-02-26, 02-27, 02-28, 03-01, 03-02` (5 calendar days) |
| Emitted bar dates | `2026-02-26, 02-27, 03-02` (3) |
| **Gaps declared** | **2** — `2026-02-28`, `2026-03-01` |
| **`expectedBarCountBasis`** | **`DECLARED_RANGE_ONLY`** |
| **Reconciled** | ✅ **3 emitted + 2 declared gaps = 5 expected** |
| Completeness | 60.00 % |
| **Policy** | **`REPORT_ONLY`** — no auto-fill, no interpolation, no carry-forward |
| **`repairedAnything`** | **false** |
| Load digest | `canonicalDigest` over the ordered per-bar snapshot identities |
| **Adds an identity layer?** | **NO** (`snapshotId` inputs remain `provider, dataVersion, asOf`) |

> ⚠ **No trading calendar was invented.** Two requested calendar dates carry no bar. Whether they
> *should* is unknowable from any accepted artifact, so `completenessBasis` is **declared by the
> caller** and the absence is **reported, never repaired**. Omitting `expectedBarCountBasis`
> **throws E8** — verified.

> ⚠ **The bar data is the accepted P05-01 SYNTHETIC fixture** (`feed-fixtures.json` `ohlcv[0]`,
> H-0001, 3 bars). **It is not a historical sample.**

---

## 6. Reproducibility (`HA-19`) — the boundary that must not be blurred

| | |
|---|---|
| Identical boundary repeated 5× | **1** distinct `snapshotId` → **reproducible** |
| Two **different** boundaries | 2 distinct ids → correctly **not** "reproducible" (PC-3 is per-boundary) |
| Mechanism | **D-1** — identical `(provider, dataVersion, asOf)` ⇒ identical `snapshotId` |
| **`evidenceClass`** | **`CONTRACT_VALIDATION`** |
| **`isProviderEvidence`** | **false** |
| **`satisfiesTrackerExitCriterion`** | **false** |

> ⚠ **This does NOT establish that a historical load is reproducible.** It establishes that the
> **contract** is deterministic over synthetic fixtures. The tracker criterion requires a licensed
> real-data load — **D9 N-2 / OI-P04-04**.

---

## 7. Corrections, adjustments, identity

| Area | Scenarios | All matched | Key results |
|---|---|---|---|
| **Corrections** (`HA-20`) | 3 | ✅ | In-place alteration of a past boundary **rejected (PC-4)**; an additive supersession **accepted (ED-5/MP-3)** |
| **Adjustments** (`HA-21`) | 5 | ✅ | `adjusted` without `adjustmentBasisRef` → **REJECT (AJ-3/SM-11/L-11)**; adjusted replacing unadjusted → **REJECT (AJ-1)**; silently applied factor → **REJECT (RC-4)** |
| **Identity** (`HA-22`) | 3 | ✅ | One anchor across an `active → suspended` transition (**LC-2**); a changed anchor → **reject**; `delisted_by_absence` → **reject (LC-6)** |

⚠ **Even the conforming adjustment case validates a DECLARATION only.** No adjusted value is
computed anywhere in P05-03 — **RC-5: the adjustment engine is P08**.

⚠ **The lifecycle vocabulary is unchanged**: `['active','suspended','delisted','merged','superseded']`.

---

## 8. Namespace and D02 field set (`HA-29`)

| | |
|---|---|
| Token | **`MD:`** — OI-10 unchanged |
| Key form | `MD:<domain>.<field>` |
| D02 keys | **10** — all namespaced, all canonical form |
| Required (P01 §4) | `open, high, low, close, volume, barInterval, adjusted` |
| Conditional | `adjustedClose, adjustmentFactor, adjustmentBasisRef` |
| **Vocabulary added** | **none** |
| **`sessionRef`** | **NOT emitted** — listed in `P01_SCHEMA_CATALOG` D02 but **undefined** in `P01_FIELD_DICTIONARY` §4. Recorded as **BD-P05-03-06**, not invented |
| **Canonical boundary forked** | **false** — same function objects as the P05-02 contract |
| **P05-01 D02 emission** | **unchanged** — 7 keys, `asOf` scalar, `snapshotId` per ST-2 |

---

## 9. Determinism and reproducibility of this package

| Check | Result |
|---|---|
| Evidence regeneration | **byte-identical** across consecutive runs |
| Contract evaluation × 5 | **1** distinct digest |
| Wall-clock / random / ambient input in the module | **none** (test HA/27) |
| Evidence files | **13** |

Verify: `cd p05 && npm run evidence:p05-03 && git diff --stat p05/evidence-p05-03`

---

## 10. Boundary verification

| Check | Result |
|---|---|
| Accepted P04 artifacts vs `efe33ea` | **0 differing** |
| Accepted P01/P02 artifacts | **0 differing** |
| `OI-08` / `OI-09` / `OI-10` | unchanged |
| **ADR-01 C1–C6** | unchanged |
| Lifecycle vocabulary / `snapshotId` composition | unchanged |
| Provider register | **1** identity: `localfix`, `LOCAL_FIXTURE`, retired `[]` |
| Provider selected / contacted | **NO** |
| Credentials / API keys / secrets | **0** literal assignments, **0** AKIA, **0** PEM, **0** bearer |
| Network / HTTP surface | **0** URLs, **0** `node:net\|tls\|http\|https\|dns` imports, **0** dependencies |
| Vendor SDKs / commercial vendor names | **0** |
| Licensed historical data acquired | **NO** |
| Adjusted series generated / adjustment engine | **NO** |
| Series storage / PIT storage / PIT query | **NO** |
| **P05-04** orchestration | **NOT AUTHORIZED**, not implemented |
| Tenant/region attribute | **none invented** |
| Existing-IIPS | untouched |
| **Boundary attestations** | **41 of 41 `false`** |

---

## 11. ⚠ Two disclosures

### 11.1 One existing test was scoped, not weakened

`p05/tests/no-provider-dependency.test.js` excluded only `liveAdapterContract.js` from the strict
"never names retry" rule. The exclusion was extended to `historicalAdapterContract.js`, which
**D9 A-3** places in the same category. **The identical behavioural assertions** (no backoff, no
loop, no attempt counter, no wait primitive) now apply to it **too**, and **HA/19** asserts them
again. **No P05-01 assertion was altered.** Full detail: `P05_03_OPEN_ITEMS.md` §3.1.

### 11.2 Two keys were shortened, and a scanner blind spot was found

`scanForSecrets` matches 40+ character base64-shaped quoted strings and scans JSON **whole**, so a
long camelCase identifier is a false positive. Two P05-03 keys were shortened (meanings
unchanged). ⚠ **The P05-01 scanner was NOT modified.**

⚠ **A genuine blind spot was also observed and is recorded, not fixed:** the scanner tests only
the **first** match per pattern and exempts it if it is pure hex — so a file whose first long
token is a hex digest is **not scanned further**. This **extends BD-P05-02-06**. Repairing it is
out of P05-03 scope and would change P05-01 behaviour. Full detail: `P05_03_OPEN_ITEMS.md` §3.2.

---

## 12. Evidence files (`p05/evidence-p05-03/`, 13)

`00-INDEX.json` · `01-contract-manifest.json` · `02-capability-and-conformance.json` ·
`03-range-semantics.json` · `04-gaps-and-load-reconciliation.json` · `05-reproducibility.json` ·
`06-corrections-and-revisions.json` · `07-adjustment-declarations.json` ·
`08-identity-stability.json` · `09-namespace-and-d02-fields.json` ·
`10-determinism-repeatability.json` · `11-blocked-and-open-items.json` ·
`12-boundary-attestations.json`

Every file carries the same `classification` block, including
`evidenceClass: CONTRACT_VALIDATION`, `isRealHistoricalSample: false` and the three tracker
columns as **UNMET**.

---

## 13. Gate position — unchanged

| | |
|---|---|
| **P05** | **AUTHORIZED / NOT_ACCEPTED** — still **5 of 18** gates accepted |
| **P05-01** | IMPLEMENTED / EVIDENCED |
| **P05-02** | SPECIFICATION + ADAPTER-CONTRACT COMPLETE · live execution NOT AUTHORIZED |
| **P05-03** | **SPECIFICATION + ADAPTER-CONTRACT COMPLETE (P05-03-A)** · **licensed acquisition NOT AUTHORIZED** |
| **P05-04** | **NOT AUTHORIZED** |
| `P05_GATE_ACCEPTANCE.md` | **DOES NOT EXIST — not created** |
| **Certification** | `NONE_GRANTED` |
| **Production activation** | `NOT_AUTHORIZED` |
| **P06 / P07 / P08** | **NOT STARTED / NOT PROMOTED** |

**No new authority decision was created by this unit.**
