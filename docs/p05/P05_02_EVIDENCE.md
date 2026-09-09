# P05-02 — EVIDENCE RECORD (adapter specification / contract package)

**Contract:** `P05-02-LIVE-MARKET-DATA-ADAPTER-CONTRACT` **v1.0**
**Authorization:** `docs/d9/D9_P05_ENTRY_AUTHORIZATION.md` §3 **A-2** — commit `31c26553554f021928a4f9e4f41b6ee90cdfa453`
**Baseline:** P05-01 at `bf66c99cec1f7e43ae4dbc3ab5e77c23a27b014d`
**Companions:** `docs/p05/P05_02_SPECIFICATION.md` · `docs/p05/P05_02_OPEN_ITEMS.md`
**Machine-readable evidence:** `p05/evidence-p05-02/` (13 files) — regenerate with
`cd p05 && npm run evidence:p05-02`

> ## ⚠ CLASSIFICATION OF THIS ENTIRE PACKAGE
>
> | | |
> |---|---|
> | **Evidence class** | **CONTRACT VALIDATION** |
> | **Is it provider evidence?** | ❌ **NO** |
> | **Is it integration-test evidence?** | ❌ **NO** |
> | **Does it establish that authenticated ingestion works?** | ❌ **NO** |
>
> Every result below was produced **offline against a synthetic test double** (`mocklive`,
> `_status: "SYNTHETIC_TEST_DOUBLE"`, **not** a provider-register issuance). No provider was
> selected, named, contacted or bound. No credential was provisioned.
>
> The tracker's P05-02 **Exit Criteria** (*"Authenticated ingestion works"*), **Test / Validation**
> (*"Integration tests"*) and **Evidence** (*"Provider evidence"*) all remain **UNMET** —
> `BD-P05-02-01…03`. The tracker does **not** treat a local contract test as an integration test, so
> nothing here is labelled as one.

---

## 1. Contract version and interface

| Field | Value | Evidence |
|---|---|---|
| Contract ID | `P05-02-LIVE-MARKET-DATA-ADAPTER-CONTRACT` | `01-contract-manifest.json` |
| Contract version | **1.0** | LA-1 (versioning rules mirror **AV-3/AV-4/AV-5**) |
| Rule prefix / count | **`LA-`** · **LA-1…LA-31** | `LA-` verified unused across `docs/` and `p05/` before adoption |
| Sole public ingress | `snapshot(request)` — `MarketDataSource<T>` (**LA-3**, P02 **B-4**/AD-2) | `02-canonical-envelope.json` |
| Provider kinds | `LOCAL_FIXTURE`, `LIVE` (**LA-2**) | `01-contract-manifest.json` |
| Common operations | `declare`, `preflight`, `normalize`, `map`, `validate`, `emit` | test **A/4** |
| Live-only operations | `authenticate`, `checkEntitlement`, `fetch` | test **A/4** |
| Phase count / ordering | 9 phases, strictly ordered 1…9 | test **A/2** |
| Gate order | capability → entitlement → authentication → acquisition (**LA-4**) | test **A/2**, **I/4** |
| Every phase cites an accepted artifact | P01 / P02 / P04 / ADR only | test **A/3** |

**LA-4 justification (not an invented order).** The execution order **reproduces** the existing
`CLASSIFICATION_GATE_ORDER` — verified still `['E6','E3','E2','E1']` (test **A/2**) — and honours
**EV-1** (entitlement before acquisition). Authentication is not acquisition.

## 2. Canonical input / output envelope

| Property | Observed | Evidence |
|---|---|---|
| `snapshotId` | `data-mocklive-v888435d2c98a6161-2026-03-04T09:31:00.000Z` | `02-canonical-envelope.json` |
| Format | Matches the frozen `data-${provider}-${dataVersion}-${asOf}` pattern (**S-2**, **SI-1**, AD-6) | test **N/2** |
| Envelope slots | `asOf, completenessPct, dataVersion, domain, fields, identity, identityMappingVersion, lineage, mode, namespaceVersion, provider, quality, receivedAt, schemaVersion, snapshotId` | `02` |
| Result envelope | `{ ok, snapshot, quality, completenessPct, record, receipt, trace }` — **same shape as P05-01** | test **N/2** |
| Quality / completeness (clean run) | `good` / `100` | `02` |
| **Canonical model forked?** | ❌ **NO** — `forked: false`; P05-01 modules imported verbatim (**LA-27**) | test **N/1** |
| Absence semantics | `PRESENT` / `NULL_ASSERTED` / `NOT_PROVIDED` / `WITHHELD` — **four distinct states, none conflated** | tests **D/3**, **D/4**, **I/7** |

## 3. Field mapping boundary

| Property | Observed | Evidence |
|---|---|---|
| Mapping declared as **data** | 5 mapping entries + 1 derived field, each citing **MD-1…MD-8** | `03-field-mapping-boundary.json` |
| Heuristic matching | **PROHIBITED** (**MR-2**) — no fuzzy or name-similarity matching | spec §3.Q |
| Reviewable without reading code | **YES** (**MR-4**) | `03` |
| Declared wire schema | 8 **required** + 2 **optional** native elements | `03`, test **C/5** |
| Required vs optional | An absent **optional** element is **silence** → `NOT_PROVIDED`; an absent **required** element is **E5** (**IC-5**) | tests **D/3**, **D/1** |
| Native vocabulary declared | **13** tokens (`qBid, qAsk, qLast, qBSz, qASz, instRef, mktCode, pxCcy, obsTime, respCode, RC-4001, RC-5003, MOCK-EQ-0001`) | `03` |
| Ignored elements recorded | **YES** — `R-15` (**IC-4**); silent discard prohibited | `03`, test **C/5** |
| Free-form bag / `extras` / metadata blob | **NONE** on snapshot, field or lineage (**M-4**) | test **M-4** |

## 4. Error mapping

**13 of 13 declared negative scenarios produced exactly their declared class.** `allMatched: true`.

| Case | Expected | Observed | Produces snapshot |
|---|---|---|---|
| `LQ-E6-DOM` (domain `D07`) | **E6** | E6 | no |
| `LQ-E6-GRAN` (granularity `1M`) | **E6** | E6 | no |
| `LQ-E6-MODE` (mode `PIT`) | **E6** | E6 | no |
| `LQ-E3` (entitlement DENIED) | **E3** | E3 | no |
| `LQ-E2` (auth FAILED) | **E2** | E2 | no |
| `LQ-E1` (source unreachable) | **E1** | **ok, `quality: unavailable`, empty fields** | ✅ **the only one** |
| `LQ-E4` (transient) | **E4** | E4 | no |
| `LQ-E7` (rate limit) | **E7** | E7 | no |
| `CS-LOCAL-UNMAPPED` | **E8** | E8 | no |
| `LQ-E5-TYPE` | **E5** | E5 | no |
| `LQ-E5-MISSING` | **E5** | E5 | no |
| `LQ-E8-CCY` (`US$`) | **E8** | E8 | no |
| `LQ-E8-AMBIG-TS` | **E8** | E8 | no |

| Additional finding | Result |
|---|---|
| **E1–E8 unchanged** (**FC-6** / INV-6) | ✅ no class added, removed or reclassified |
| Quality-bearing classes | **`['E1']` only** — test **I/2** |
| **E6 is pre-flight** — no fetch, no authenticate, trace stops at `['preflight']` | ✅ test **I/3** |
| Retryable classes | **`['E4','E7']`**; retry-prohibited `['E2','E3','E5','E6','E8']`; **zero overlap** (**ES-4**) |
| **LA-28 implements no retry policy** | ✅ no backoff, no loop, no mutated attempt counter, no `sleep(`/`delay(` — test **J/1** |
| Failure record | **F-1…F-11** complete; `F-5` is the canonical identity reference, never a provider symbol |
| **RD-4** — a C1 abort reports a **count**, not the offending native key | ✅ test **J/3** |

## 5. Provenance, `asOf` / version

| Property | Observed | Evidence |
|---|---|---|
| Lineage block complete (**S-5**, **RF-6**) | All 6 required elements present | `05`, test **G/1** |
| Field provenance resolves into lineage (**RF-7**) | ✅ every field | test **G/2** |
| `asOf` ≠ `receivedAt` (**T-1**) | `2026-03-04T09:31:00.000Z` vs `2026-03-04T10:00:00.000Z` | test **H/1** |
| `receivedAt` never recomputed (**D-4**, **TS-6**) | A supplied instant passes through verbatim | test **H/2** |
| Six version axes | all six populated; **independence proven by an `adapterVersion` bump moving only `adapterVersion`** (**SI-4**: `snapshotId` unchanged) | test **C/1** |
| `identityMappingVersion` passed through (**VX-4**, **S-6**) | `idmap-localfix-1.0.0` — identical to the P04 register version | test **C/2** |
| `adapterId`/`adapterVersion` in **lineage**, not in `snapshotId` (**SI-4**) | ✅ | test **C/3** |
| Freshness | **inputs only**; `thresholdApplied: false`, `verdict: null`, `owner: 'P07'` (**MQ-1**) | tests **H/3**, **H/4** |
| Negative age | **reported, not corrected or judged** | test **H/4** |

## 6. Identity / mapping · venue · lifecycle

| Property | Observed | Evidence |
|---|---|---|
| Identity resolved through the **same** P04 register as P05-01 | `CS-LOCAL-0001` → `technology-H1`, `adapterCrossing: true` | test **F/1** |
| **OI-08** 1:N carried | `canonical → companyId` is an N:1 projection (**MC-2**) | `06` |
| **OI-09** FIGI authoritative | `FIGI/AUTHORITATIVE`, `ISIN/NON_AUTHORITATIVE`; value synthetic `BBG00SYNTH01` | test **F/2** |
| **OI-P04-04** | **OPEN** — no sourcing/licensing/coverage claim | `06`, **BD-P05-02-04** |
| **FC-1** fail-closed on an unmapped identity | Rejected as **E8**; `isQualityState: false`; **not E1** | test **F/3** |
| **FC-3** deterministic failure | 3 runs → 1 identical outcome | test **M/4** |
| **VN-5 / PN-2** — provider code is never venue identity | `venueRef` follows the **P04 reference**, not `mktCode` (proven by making them disagree: `XSYN` vs `XSYNSG1`) | test **F/4** |
| **VN-3** operating vs segment MIC | both exercised | `06` |
| Lifecycle enumeration | 5 states, **none added** | `06` |
| ⚠ Lifecycle **coverage** | **2 of 5 exercised** — `suspended`/`merged`/`superseded` unexercised | **BD-P05-02-07** |

## 7. Namespace

| Property | Observed | Evidence |
|---|---|---|
| **OI-10** token / form | `MD:` / `MD:<domain>.<field>` — used exactly as recorded | `07`, test **N/1** |
| Emitted keys | `MD:price.ask`, `MD:price.askSize`, `MD:price.bid`, `MD:price.bidSize`, `MD:price.last`, `MD:price.venueRef` | test **E/1** |
| Every key namespaced + canonical form | ✅ 6 of 6 | test **E/1** |
| Domain segments | `price` only — from the **accepted D01 dictionary**; **none invented** | test **E/3** |
| **ADR-01 C1–C6** | **UNCHANGED**; **C5 fail-closed abort** exercised and confirmed | test **E/2** |
| No `<NS>` → `MD:` rewrite of accepted artifacts (**N-7**) | ✅ `docs/p01`, `docs/p02`, `docs/p04` unmodified since `efe33ea` | §11 |

## 8. Credential / entitlement abstraction

**Entitlement — 6 of 6 evaluations matched; `allMatched: true`.**

| Fixture | Status | Permits acquisition | Reason |
|---|---|---|---|
| `ENT-0001` | `ENTITLED` | ✅ | with `entitlementRef` (**EV-6**) |
| `ENT-0002` | `DENIED` | ❌ | fail closed (**EV-4**) |
| `ENT-0003` | `EXPIRED` | ❌ | distinguishable from never-entitled |
| `ENT-0004` | `UNKNOWN` | ❌ | **EV-3** default deny |
| `ENT-0005` | `PARTIAL` | ✅ | entitled fields **+ 2 `WITHHELD`** with `entitlementRef` (**EV-8**, **RD-1**, **NL-5**) |
| `ENT-0006` | **absent** | ❌ | **EV-3**; an empty matrix means nothing is entitled (**EM-4**) |
| *(additional)* `ENTITLED` with no ref | — | ❌ | **EV-6** — not evidence-bearing |

| Credential surface | Observed |
|---|---|
| `declareCredentialRequirement()` returns | `status: 'REQUIREMENT_ONLY'`, `valuePresent: false`, `endpointPresent: false`, `owner: 'P03'` |
| Undeclared `kind` / `storageClass` | **rejected** with E8, not accepted (test **L/2**) |
| Missing `credentialRef` | **rejected** — *"an opaque reference, never a value"* |
| `authenticate()` returns | `credentialRef` only; `valuePresent: false`, `endpointPresent: false` (test **L/6**) |
| Entitlement matrix | **EMPTY** (**EM-2**) — the correct state |
| Secret boundary scan | snapshot · record · receipt · declaration · fixture — **all clean** |
| ⚠ **BD-P05-02-06** | The P05-01 regex scanner **does not** detect the serialized-JSON credential form; **LA-20's structural walk does**. Measured, recorded, not worked around (tests **L/4**, **L/4b**) |

## 9. Local mock / contract test results

**`cd p05 && npm test` → `# tests 192 · # pass 192 · # fail 0`**

| File | Tests | Pass | Fail |
|---|---|---|---|
| **`adapter-contract.test.js`** *(new — P05-02)* | **74** | **74** | **0** |
| `determinism.test.js` | 12 | 12 | 0 |
| `existing-iips-boundary.test.js` | 11 | 11 | 0 |
| `identity-collision.test.js` | 24 | 24 | 0 |
| `namespace.test.js` | 15 | 15 | 0 |
| `negative.test.js` | 21 | 21 | 0 |
| `no-provider-dependency.test.js` | 14 | 14 | 0 |
| `provenance.test.js` | 13 | 13 | 0 |
| `replay-idempotency.test.js` | 8 | 8 | 0 |
| **Total** | **192** | **192** | **0** |

**118 P05-01 tests + 74 P05-02 tests.** The P05-01 suite passes **unchanged in substance** alongside
the new contract (see §10 for the one disclosed test-file change).

**Coverage of the 74 P05-02 tests**, by the groups the tasking required:

| Group | Tests | What is established |
|---|---|---|
| **A** provider-neutral interface conformance | 8 | phase order, gate order, authority citations, live/common split, surface conformance, `NOT_REQUIRED` rejection, authorization matrix |
| **B/C** request-response shape, schema/version | 7 | declaration conformance, missing element, invalid domain, CD-6, six axes, VX-4, SI-4, CT-3, wire schema |
| **D/E** normalization, namespace | 5 | E5 before E8, `NOT_PROVIDED`, `NULL_ASSERTED`, `MD:<domain>.<field>`, C1–C5, accepted segments |
| **F/G/H** identity, provenance, times | 7 | P04 register, OI-09, FC-1 fail-closed, VN-5, lineage, RF-7, asOf/receivedAt, freshness |
| **I/J** error mapping, retry | 8 | all E-classes, E1-only quality-bearing, E6 pre-flight, trace order, E3 rejection, EV-3, EV-8, LA-28, F-1…F-11, RD-4 |
| **K/L** leakage, secrets | 8 | clean run, provenance-smuggling detection, M-4, credential requirement, undeclared kind, secret boundary, measured scanner gap, LA-19, authenticate |
| **M** deterministic output | 4 | 5 identical digests, pure mapping, canonical ordering, repeatable failure |
| **N** P05-01 compatibility | 5 | no fork, same ingress, substitutability, local feed is not a live adapter, non-regression |
| **O** provider / authorization boundary | 8 | offline proof, no provider selected, no vendor named, no live claim, LA-31 gap, known limitations, no tenant/region invention, P05 NOT_ACCEPTED |
| **P** observability | 3 | R-1…R-15, SL-1…SL-4, derivable metrics, redaction attestations, PB-2 |

## 10. Determinism and reproducibility

| Check | Result |
|---|---|
| 5 independent contract runs → **1 distinct digest**, **1 distinct `snapshotId`** | ✅ **byte-identical** (`10-determinism-repeatability.json`) |
| Content change ⇒ new `dataVersion` ⇒ new `snapshotId` (**VX-2**) | ✅ test **M/2** |
| Field and lineage ordering canonical (**D-5**) | ✅ test **M/3** |
| Rejected request deterministic across 3 runs (**FC-3**) | ✅ test **M/4** |
| **Evidence regeneration** — `npm run evidence:p05-02` run **3×** | ✅ **all 13 files byte-identical** (sha256 compared pairwise: run1≡run2, run2≡run3) |
| Wall-clock / random / ambient input in `p05/src/` | **0 occurrences** |

> ⚠ **Scope.** This is determinism of the **contract pipeline against fixed fixtures**. It is **not**
> a claim about live-provider determinism, which is unknowable without a provider.

## 11. Boundary verification

| Assertion | Result |
|---|---|
| Network / process-spawning imports in `p05/src/` | **0** |
| `Date.now` / `new Date()` / `Math.random` / `crypto.randomUUID` / `process.env` in `p05/src/` | **0** |
| Endpoint URLs in the 5 new P05-02 source/fixture/script files | **0** |
| Vendor names in P05-02 artifacts | **0** |
| Secret hits over **18** P05-02 files (evidence + source + fixtures + tests) | **0** |
| `dependencies` / `devDependencies` | `{}` / `{}` — **zero** runtime dependencies |
| Lockfile / `node_modules` | **none** |
| `docs/p01`, `docs/p02`, `docs/p04`, `docs/d5`, `CHECKPOINT-02`, `CHECKPOINT-03` modified since `efe33ea` | **none** (`git diff --numstat` empty) |
| SPEC `.docx` / TRACKER `.xlsx` modified | **none** |
| `p05/fixtures/provider-register.json` modified | **none** — still exactly **1** issuance (`localfix`) |
| `docs/p06` / `docs/p07` / `docs/p08` | **do not exist** |
| Behavioural offline proof | the entire pipeline succeeds with `globalThis.fetch` made to **throw** (test **O/1**) |

### 11.1 ⚠ One P05-01 test file was modified — disclosed

`p05/tests/no-provider-dependency.test.js`. Two **lexical** assertions ("no file in `src/` matches
`/authenticat\w*\s*\(/`" and "…matches `/\bretr(y|ies|ying)\b/`") fired on the new contract module,
which legitimately **names** an `authenticate` phase and a retry-class table — both authorized by
D9 **A-2** as *"contract shape"* and *"error taxonomy mapping"*.

Each assertion now enumerates the **P05-01 modules explicitly** and applies to exactly that set,
**unchanged in substance**. The scheduler / async / checkpointing assertions still apply to **every**
file in `src/`. **Added, strictly stronger:** no transport import, no `process.env`, no key material,
no backoff, no retry loop, no mutated attempt counter, no `sleep`/`delay` — plus the **behavioural**
offline proof in test **O/1**. **No assertion was weakened or deleted.** Full detail:
`docs/p05/P05_02_OPEN_ITEMS.md` §5.

## 12. Known blocked / provider-dependent items

| # | Item | Status |
|---|---|---|
| **BD-P05-02-01** | **BD-02** — provider selection / entitlement / credentials / **P16** authority (= **DEP-P02-07**, **DEP-P02-06**, INV-10) | **OPEN** |
| **BD-P05-02-02** | "Authenticated ingestion works" — tracker Exit Criteria | **UNVERIFIED — not claimed** |
| **BD-P05-02-03** | "Integration tests" + "Provider evidence" | **UNVERIFIED — not claimed** |
| **BD-P05-02-04** | **OI-P04-04** — FIGI sourcing, licensing, coverage | **OPEN** |
| **BD-P05-02-05** | ISO-4217 vocabulary is provider-specific configuration (**LA-31**) | **OPEN** — local double is `SHAPE_ONLY` |
| **BD-P05-02-06** | P05-01 regex scanner misses the serialized-JSON credential form | **OPEN** — LA-20 covers it structurally |
| **BD-P05-02-07** | Lifecycle fixtures exercise 2 of 5 states | **OPEN**, non-blocking |
| **BD-P05-02-08** | **OI-P04-03** — tenant/region governance attribute set | **OPEN** — **no attribute invented** |
| **BD-P05-02-09** | **P05-04** orchestration | **NOT AUTHORIZED** (D9 **N-3**) |
| **BD-P05-02-10** | **A3 gate acceptor** | **UNKNOWN** — the only person-level hard blocker |

**Resolved by this package: NONE.** No open item was closed, narrowed or reinterpreted.

## 13. Evidence files

`p05/evidence-p05-02/` — 13 files, byte-identical across 3 regenerations:

`00-INDEX.json` · `01-contract-manifest.json` · `02-canonical-envelope.json` ·
`03-field-mapping-boundary.json` · `04-error-mapping.json` · `05-provenance-asof-version.json` ·
`06-identity-mapping-venue-lifecycle.json` · `07-namespace.json` ·
`08-entitlement-credential-abstraction.json` · `09-capability-and-conformance.json` ·
`10-determinism-repeatability.json` · `11-blocked-provider-dependent-items.json` ·
`12-boundary-attestations.json`

Every file carries the same `classification` block asserting
`evidenceClass: "CONTRACT_VALIDATION"`, `isProviderEvidence: false`,
`isIntegrationTestEvidence: false`, `establishesAuthenticatedIngestionWorks: false`, and the three
tracker columns as **UNMET**.

## 14. Gate position — unchanged

| | |
|---|---|
| **P05** | **AUTHORIZED / NOT_ACCEPTED** — still **5 of 18** gates accepted |
| **P05-01** | IMPLEMENTED / EVIDENCED |
| **P05-02** | **SPECIFICATION + ADAPTER-CONTRACT COMPLETE** · **LIVE EXECUTION NOT AUTHORIZED** |
| **P05-03** | Specification only authorized — not started |
| **P05-04** | **NOT AUTHORIZED** |
| `P05_GATE_ACCEPTANCE.md` | **DOES NOT EXIST — not created** |
| **Certification** | `NONE_GRANTED` |
| **Production activation** | `NOT_AUTHORIZED` |
| **P06 / P07 / P08** | **NOT STARTED / NOT PROMOTED** |

`Phase Gates!P05` defines **one** acquisition gate spanning P05-01…P05-04, promoted only by
**"Explicit gate acceptance; no automatic promotion."** No acceptance act was performed here, and
the **A3 gate acceptor remains UNKNOWN**.
