# P05-01 — EXECUTION EVIDENCE

**Item:** P05-01 — Local deterministic market feed (tracker `Work Tracker`!P05-01)
**Authorization:** `docs/d9/D9_P05_ENTRY_AUTHORIZATION.md` §3 **A-1 — P05-01 FULL**
**Authorization commit:** `31c26553554f021928a4f9e4f41b6ee90cdfa453`
**Baseline:** `efe33eae287d2181cfdd5a838b0d9e5112fcdad3`
**Executed:** 2026-09-09 · Node v22.22.3 · zero dependencies

> ## ⚠ THIS IS NOT P05 ACCEPTANCE
>
> **P05 ENTRY/AUTHORIZATION = AUTHORIZED · P05 ACCEPTANCE = NOT_ACCEPTED ·
> CERTIFICATION = NONE_GRANTED · PRODUCTION ACTIVATION = NOT_AUTHORIZED.**
>
> **No `P05_GATE_ACCEPTANCE.md` exists and none is created here.** This package records what
> was executed and what came back. It is the P05-01 portion of the evidence eventual P05
> acceptance will require — not an acceptance act.

---

## 1. Commands executed and their exact results

| # | Command | Result |
|---|---|---|
| 1 | `cd p05 && node --test "tests/**/*.test.js"` | **118 tests · 118 pass · 0 fail** · 0 cancelled · 0 skipped · 0 todo |
| 2 | repeated ×3 | **118/118 on every run** — identical |
| 3 | `cd p05 && node scripts/generate-evidence.js` | 13 evidence files written |
| 4 | regenerate ×3, `sha256sum evidence/*.json` compared | **all 13 files byte-identical across 3 regenerations** |

### 1.1 Per-file test breakdown (sums to 118)

| Test file | Pass | Fail | Covers |
|---|---|---|---|
| `namespace.test.js` | **15** | 0 | OI-10 token, dictionary vocabulary conformance, ADR-01 C1–C6 |
| `determinism.test.js` | **12** | 0 | Required surface **1** and **9**; D-1…D-6, SI-4, DV-5, TS-5, NP-4 |
| `replay-idempotency.test.js` | **8** | 0 | Required surface **2**; INV-2, SN-4, RI-1…RI-4 |
| `provenance.test.js` | **13** | 0 | Required surface **3**, **4**, **5**; L-1…L-11, SN-2, VX-1…VX-4, VA-1 |
| `negative.test.js` | **21** | 0 | Required surface **6**, **7**; E1–E8, NL-*, RJ-*, SM-*, ST-* |
| `identity-collision.test.js` | **24** | 0 | Required surface **8**; MC/MP/PN/FC/ADP/XI/CS/VN, C4 |
| `no-provider-dependency.test.js` | **14** | 0 | Required surface **10**; A-23, SM-4, PR-8, P05-02/03/04 boundary |
| `existing-iips-boundary.test.js` | **11** | 0 | Existing-IIPS non-regression; AD-17 firewall |
| **TOTAL** | **118** | **0** | |

---

## 2. Required deterministic test surface — all ten satisfied

| # | Required | Where proven | Result |
|---|---|---|---|
| 1 | Same fixture + same version/asOf ⇒ identical normalized output | `determinism.test.js` "1."; `evidence/03` | ✅ byte-identical across independent feed instances |
| 2 | Replay does not create duplicate canonical records | `replay-idempotency.test.js` "2."; `evidence/06`,`07` | ✅ 8 records after 3 passes; **0 duplicates** |
| 3 | Provenance preserved and inspectable | `provenance.test.js` "3."; `evidence/04` | ✅ L-1…L-11 present; every field provenance resolves in the lineage block |
| 4 | `asOf` preserved and distinguishable from ingest time | `provenance.test.js` "4."; `evidence/05` | ✅ `asOf ≠ receivedAt` on all 8; `receivedAt ≥ asOf` (SM-9) |
| 5 | Version information preserved | `provenance.test.js` "5."; `evidence/05` | ✅ all **six** axes present and separately addressable |
| 6 | Invalid/malformed input ⇒ deterministic failure | `negative.test.js` "6."; `evidence/08` | ✅ 8/8 cases match declared class; identical on rerun |
| 7 | Missing required data ⇒ defined negative/error behaviour | `negative.test.js` "7."; `evidence/08` | ✅ E1 empty-field snapshot; `NOT_PROVIDED` never coerced |
| 8 | Identity/collision does not bypass C1–C6 | `identity-collision.test.js` "8."; `evidence/09` | ✅ S1→S4 passes; C4 collision correctly aborts |
| 9 | Repeated execution reproducible | `determinism.test.js` "9."; `evidence/10` | ✅ 5 independent runs → **1** distinct digest |
| 10 | No live-provider dependency | `no-provider-dependency.test.js` "10." | ✅ runs with `fetch` forced to throw; 0 dependencies |

---

## 3. Positive-path evidence — 8 acquisitions

| Fixture | `snapshotId` | quality | completeness | fields |
|---|---|---|---|---|
| Q-0001 | `data-localfix-v10220dc2c33df0e4-2026-03-02T14:30:00.000Z` | good | 100 | 6 |
| Q-0002 | `data-localfix-v7ff01f9f702518bd-2026-03-02T14:30:00.000Z` | **partial** | **33.33** | 6 |
| C-0001 | `data-localfix-vd4521c1ece53346f-2026-03-02T00:00:00.000Z` | good | 100 | 6 |
| C-0002 | `data-localfix-v499ed6f25513a959-2026-03-03T00:00:00.000Z` | **partial** | **80** | 5 |
| V-0001 | `data-localfix-v2823e367943de8ce-2026-03-02T00:00:00.000Z` | **partial** | **75** | 4 |
| H-0001 | `data-localfix-v1c3bd7d7048e1cc6-2026-03-02T00:00:00.000Z` | good | 100 | 7 |
| VEN-XSYN | `data-localfix-v083dd54992e57ce9-2018-01-01T00:00:00.000Z` | good | 100 | 6 |
| VEN-XSYNSG1 | `data-localfix-vc010b8366e3fcd20-2018-01-01T00:00:00.000Z` | good | 100 | 6 |

- `snapshotId` is exactly `data-${provider}-${dataVersion}-${asOf}` on all 8 (ST-2/ST-3).
- `dataVersion` is content-derived (`v` + 16 hex chars of the payload digest) — DV-1/DV-2.
- Q-0002, C-0002 and V-0001 are `partial` because the source was **silent** about contracted
  fields. Silence is recorded as `NOT_PROVIDED` with `value: null` — **never** `0`, `""` or a
  carried-forward value (NL-4, NL-7, A-20). `completenessPct` is computed from the contracted
  field set (Q-2, NL-6), not asserted.
- C-0001 and C-0002 differ only in session date and therefore carry **different `dataVersion`
  and different `snapshotId`** — a correction is a new vintage, never an edit (DV-3, INV-2).

### 3.1 Namespace conformance (`evidence/09`)

| Property | Value |
|---|---|
| Token | **`MD:`** (OI-10, `CHECKPOINT-03.md`:75–77) |
| Canonical form | **`MD:<domain>.<field>`** |
| `namespaceVersion` | `1.0` |
| Distinct keys emitted | **28** |
| Every key namespaced | **true** |
| Every segment in the permitted vocabulary | **true** |
| **Bare engine keys emitted** | **`[]`** — none |
| Collision-critical keys | `MD:valuation.peRatio` · `.evEbitda` · `.evRevenue` · `.fcfYield` |

Segments emitted: `ohlcv` · `price` · `valuation` · `venue`. All are taken verbatim from the
accepted `P01_FIELD_DICTIONARY.md`; `tests/namespace.test.js` asserts the implementation
vocabulary **equals** the dictionary's set exactly, so "no invented label" is mechanically
verified rather than claimed.

### 3.2 Identity / mapping conformance (`evidence/09`)

| Property | Evidence |
|---|---|
| **OI-08 = 1:N** (MC-1) | `CI-LOCAL-ALPHA` → `CS-LOCAL-0001`, `CS-LOCAL-0002` |
| **N:1 projection** (MC-2) | `technology-H1` ← 3 distinct canonical security IDs — expected, not an error |
| MC-4 not violated | those securities remain distinct; no merge or collapse |
| **OI-09 = FIGI/OpenFIGI** (XI-1) | FIGI `AUTHORITATIVE`; ISIN/CUSIP `NON_AUTHORITATIVE` |
| FC-1 | unmapped `CS-LOCAL-UNMAPPED` → explicit named failure |
| FC-2 | unresolved `BBG00SYNTH99` → explicit failure, **no fallback** to ISIN/CUSIP or a symbol |
| MP-2 / ADP-1 | `INFERRED_FROM_SYMBOL` rejected at register construction |
| MP-5 | unapproved low-confidence mapping is unresolved |
| PN-2 / ID-6 | provider symbol promoted to identity → rejected |
| U-7 / PR-7 | two canonical IDs on one FIGI → explicit failure, no silent merge |
| RF-3 | `mappedCompanyId` written only by the P04-shaped adapter path |
| VN-1 / VN-3 | `XSYN` (OPERATING_MIC) and `XSYNSG1` (SEGMENT_MIC) are distinct identities |

---

## 4. Negative / error-contract evidence (`evidence/08`)

**8 of 8 cases match their declared class. `allMatch: true`.**

| Fixture | Class | Kind | Violated rules | Behaviour |
|---|---|---|---|---|
| M-0001 | **E5** | REJECTION | — | non-numeric price violates the declared wire schema |
| M-0002 | **E8** | REJECTION | `CU-1`,`CU-2`,`SM-2` | `XX1` is not ISO-4217 — rejected, not defaulted |
| M-0003 | **E8** | REJECTION | `NP-3` | 4 decimals against precision 2 — silent rounding prohibited |
| M-0004 | **E8** | REJECTION | `ADP-2`,`FC-1`,`MC-7` | unmapped identity fails closed |
| M-0005 | **E5** | REJECTION | — | non-ISO-8601-UTC timestamp |
| U-0001 | **E6** | REJECTION | — | D07 outside declared capability, pre-flight |
| U-0002 | **E6** | REJECTION | — | PIT outside declared capability (PIT is P08), pre-flight |
| X-0001 | **E1** | **DATA_CONDITION** | — | snapshot with **empty** fields, `quality: 'unavailable'` |

| Property | Value |
|---|---|
| Only quality-bearing class | **`['E1']`** — E2–E8 never produce a snapshot (PR-2) |
| Snapshot admitted downstream on rejection | **false** for all 7 rejections (RJ-2) |
| Failure records emitted | **8** — none silently discarded (FR-1) |
| Secret material in any record | **false** (FR-2, PR-8, A-23) |
| Deterministic on rerun | **true** for all cases (FC-3) |

⚠ **M-0004 is classified `E8` carrying `FC-1`/`ADP-2`/`MC-7`**, not a new class. That is
**FC-6**: E1–E8 is unchanged, an identity-resolution failure is P04-internal, and where it
surfaces at the provider boundary it maps to an **existing** class without redefining it —
and it is explicitly **not E1** and **not** a quality state (**FC-5**).

---

## 5. Determinism, replay and idempotency

### 5.1 Replay (`evidence/06`)

| Property | Value |
|---|---|
| Passes | 3 |
| Records after 3 passes | **8** (expected 8) |
| **Duplicate records created** | **0** |
| Pass 1 outcomes | 8 × `INSERTED` |
| Pass 2 outcomes | 8 × `IDEMPOTENT_NOOP` |
| Pass 3 outcomes | 8 × `IDEMPOTENT_NOOP` |
| Byte-identical across passes | **true** |
| Replay reproducible | **true** |
| Order significant (RI-2) | **true** — reversed order ⇒ different identity |
| Effective replay identity | `d1792882323c0ca6911143063b7ebc1945f23b995a5f8b2cde92a428f06d6951` |

### 5.2 Idempotency (`evidence/07`)

| Property | Value |
|---|---|
| First ingest | `INSERTED` |
| Repeat ingests | **5**, all `IDEMPOTENT_NOOP` |
| Records after repeats | **1** (expected 1) |
| **Duplicates created** | **0** |
| Conflicting payload at same `snapshotId` | **`CONFLICT_REJECTED`** — *"INV-2: a correction must be a NEW dataVersion, never a mutation"* |
| Existing record overwritten | **false** (no "last wins", RJ-6) |

### 5.3 Vintage drift (`evidence/11`, RI-4)

Swapping one contributing snapshot for a different vintage of the same instrument yields a
**different** effective replay identity — `identitiesDiffer: true`. Silent vintage drift is
therefore detectable, not silent.

### 5.4 Repeatability (`evidence/10`)

5 independent runs over all 8 acquisitions → **1** distinct run digest.

### 5.5 Determinism mechanisms

| Guarantee | Verified by |
|---|---|
| No `Date.now()` / `new Date()` in `p05/src/` | `no-provider-dependency.test.js` |
| No `Math.random` / `randomUUID` | ibid. |
| No `process.env` | ibid. |
| No `node:http`/`https`/`net`/`tls`/`child_process` in `src/` | ibid. |
| No retry/scheduler/checkpoint code | ibid. (comments stripped before scanning) |
| `dependencies` and `devDependencies` both `{}`; no lockfile; no `node_modules` | ibid. |
| Canonical key ordering at every level | `determinism.test.js` D-5 |
| Decimals as exact fixed-scale strings; NP-3 refuses silent rounding | `determinism.test.js` NP-4 |

---

## 6. Evidence package produced

`p05/evidence/` — **13 files**, all byte-reproducible:

| File | Content |
|---|---|
| `00-INDEX.json` | index, commands, gate status, open items |
| `01-fixture-manifest.json` | fixture inventory + per-fixture digests |
| `02-input-payloads.json` | representative provider-native input payloads |
| `03-canonical-output.json` | expected canonical/normalized output + digests |
| `04-provenance.json` | lineage blocks + field-provenance resolution |
| `05-asof-and-version.json` | `asOf` vs ingest time; six version axes |
| `06-replay.json` | replay across 3 passes |
| `07-idempotency.json` | idempotency + conflict rejection + event log |
| `08-negative-and-error.json` | E1–E8 cases + F-1…F-11 records |
| `09-namespace-identity.json` | namespace + identity/cardinality conformance |
| `10-repeatability.json` | 5-run repeatability |
| `11-vintage-drift.json` | RI-4 vintage-drift proof |
| `12-existing-iips-boundary.json` | existing-IIPS non-regression boundary |

---

## 7. Existing-IIPS non-regression boundary (`evidence/12`)

> ### Recorded fact, per instruction
> **This repository contains no existing-IIPS executable source.** `git ls-files` returns **0**
> matches for `iips-platform` / `LiveDataRuntime` / `DataBoundExecutor` / `ReplayService` /
> `NormalizedHolding` / `cross-sector` / `EngineRegistry` / `OntologyMapper`, and **0** tracked
> methodology / scoring / calibration source files. The boundary is therefore verified
> **structurally** — nothing in P05-01 can touch it. This fact is recorded rather than a test
> being manufactured.

| Boundary | Status |
|---|---|
| existing-IIPS source modified | **none exists; none modified** |
| `ReplayService` / `DataBoundExecutor` / `LiveDataRuntime.ts` touched | **NO** |
| **AD-17** | **UNRESOLVED** — existing-IIPS authority (M-2); replay firewall preserved |
| **M-1 / AD-4** | `OPEN_REVALIDATION_REQUIRED` — E2E-030 neither revoked nor renewed |
| **M-5** | OPEN — C12 BLOCKED |
| **M-6** | OPEN |
| Methodology / scoring / calibration / certified contract changed | **NO** |
| Sector taxonomy redefined | **NO** |
| `companyId` semantics changed; fields added to `NormalizedHolding` | **NO / 0** |
| New engine metric key introduced (INV-8) | **NO** |
| **P06 / P07 / P08** | **NOT_STARTED** — `docs/p06`, `docs/p07`, `docs/p08` absent; 0 tracked P06/P07/P08 artifacts |

The P05-01 replay harness states this in its own source header: it is **not** the
existing-IIPS `ReplayService`, and it makes **no** claim that replay verification is adequate.

---

## 8. What remains outstanding for eventual P05 acceptance

Recorded, not resolved. **P05 acceptance is a separate future act.**

| # | Outstanding | Owner / bound |
|---|---|---|
| 1 | **P05-02** live provider adapter — provider selection, entitlement, credentials, connectivity, P16 authority | **D9 A-2 authorized specification only** |
| 2 | **P05-03** licensed / deeper historical acquisition | **OI-P04-04 OPEN** |
| 3 | **P05-04** ingestion orchestration (scheduling, retries, idempotent checkpointing) | **NOT AUTHORIZED** |
| 4 | Per-record tenant/region governance application | **OI-P04-03 OPEN**, IB-1…IB-5 |
| 5 | A3 gate acceptor for P05 acceptance | **UNKNOWN** — no acceptance may occur without one |
| 6 | Certification C1–C12 | `NONE_GRANTED`; C12 BLOCKED on M-5 |
| 7 | M-1 / AD-4 revalidation; E2E-030 | existing-IIPS authority |
| 8 | AD-17 replay verification | existing-IIPS authority (M-2) |

See `P05_01_OPEN_ITEMS.md` for the full bounded-dependency register.

---

## 9. Gate position

**P05 is NOT accepted by this package.** No acceptance evidence is asserted, no gate is
promoted, and no `P05_GATE_ACCEPTANCE.md` is created.
