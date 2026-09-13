# P06-02 — EVIDENCE RECORD (raw / canonical storage boundary)

> **Authority: D10-2** — `docs/p00/P00_DECISION_LOG.md` §8.1, commit
> `b41240c406914f34f06c2f7bc3986bdeb436018d`: ***"P06 ENTRY is AUTHORIZED … Scope = `P06-01`,
> `P06-02`, `P06-03` ONLY."***
>
> ⚠ **This record covers `P06-02` only.** P06-03 is authorized for **entry** and is **NOT
> implemented** by this act (§7).
>
> ⚠ **This record is ADDITIVE.** It edits no historical authority record.

---

## 1. The authoritative scope — taken from the repository, not invented

`Work Tracker`!P06-02 (TRACKER, unmodified):

| Field | Value |
|---|---|
| Work Item | **Raw/canonical separation** |
| Requirement | **Keep raw provider payloads separate from governed canonical data.** |
| Deliverable | **Storage boundary** |
| Dependencies | `P05-04,P06-01` (Hard) — **both COMPLETE** |
| Entry Criteria | **Pipeline exists** — satisfied by P06-01 |
| Exit Criteria | **Raw data never bypasses validation** |
| Test / Validation | **Architecture + negative tests** |
| Evidence | **Boundary evidence** |
| Critical Path | YES |

`Phase Gates`!P06 intent: *"Normalize provider-specific payloads into governed canonical
representations **without feeding raw provider data directly to engines**."*

### 1.1 Governing contract — REUSED, not invented

No separate raw/canonical storage contract exists in the accepted corpus, so the **existing**
authoritative rules are implemented. Nothing new was decided:

| Source | Rule |
|---|---|
| `docs/p02/P02_PROVIDER_MAPPING_RULES.md` §1 | **M-1** provider-specific schemas/field names/symbols/enums/units/time conventions/error codes exist **ONLY inside the adapter** · **M-2** the adapter's output boundary **is** the P01 canonical schema · **M-3** no provider-specific field name may appear in a canonical snapshot, a lineage record, an engine input, a DTO, a UI surface or an evidence artifact · **M-4** unmapped native content is never smuggled through a free-form bag, `extras` map, metadata blob or provenance string · **M-5** an unsupplied canonical slot is `NOT_PROVIDED`, never fabricated |
| `docs/d4/D4_01…`:216 · `D4_03…`:114 | **INT-013** — must reference **governed IIPS objects**, never raw provider records |
| `docs/d4/D4_02…`:194 | identity resolves through the security master — **never by raw provider symbol** |
| `docs/p01/P01_VALIDATION_RULES.md` | the accepted **S1–S4** validation set, invoked **by reuse** |
| ADR-01 §C.2 | **C1–C6** fail-closed, enforced **by reuse**, no variation |

---

## 2. ⚠ The measured defect this act closes

**Before this act, raw data reached canonical storage with no validation at all.** Measured at
commit `b6160cb` — every row was **executed**, not inferred
(`p06/evidence-p06-02/01-bypass-inventory-before.json`):

| # | Bypass path | Measured before | After |
|---|---|---|---|
| **BP-1** | raw provider payload → canonical storage | `CanonicalRecordStore.ingest()` performs **no validation**; a raw payload carrying provider-native fields, **no `MD:` namespace** (`namespacedFieldCount: 0`) and a fabricated `snapshotId` was **`INSERTED`** and read back intact | **BLOCKED** |
| **BP-2** | validation on the ingest path | `ingest()` never calls `validateSnapshot` — **validation was OPTIONAL**. The validator *does* reject such an object; nothing invoked it | **BLOCKED** — the boundary re-runs S1–S4 |
| **BP-3** | raw → engine | An engine input assembled **straight from raw** `V-0001`: `{peRatio:"18.40", evEbitda:"9.15", fcfYield:"0.0520"}` — **bare engine keys, no namespace, no provenance** | **BLOCKED** — `assertEngineInputIsCanonical` (INT-013) |
| **BP-4** | unvalidated record masquerading as canonical | a `{snapshotId, fields:{}, domain}` object was **`INSERTED`** | **BLOCKED** — `assertCanonicalShape` |
| **BP-5** | raw and canonical not separated at all | **no raw compartment existed** anywhere in the P06 package | **CLOSED** — `RawCompartment` |

---

## 3. Raw/canonical architecture — before → after

### Before (at `b6160cb`)

```
raw payload ──────────────────────────────► CanonicalRecordStore.ingest()   ✗ no validation
raw payload ──────────────────────────────► engine input (bare keys)        ✗ nothing enforced
raw payload ── P06-01 normalizePayload() ─► canonical record ──(manual)──► store   ⚠ optional
                        (no raw compartment; raw and canonical not separated)
```

### After (this act)

```
raw input
   ↓ acceptRaw()        → RawCompartment — separate, deep-frozen, marked isCanonical:false,
   ↓                      append-only, exposes ONLY accept/has/read/refs/size
   ↓ admit()            → P06-01 normalizePayload        (normalization, by reuse)
   ↓                    → validateSnapshot S1–S4         (validation, by reuse)
   ↓                    → assertNoEngineDirectPath       (P06-01 engine guard, by reuse)
   ↓                    → assertCanonicalShape           (M-1…M-4)
   ↓                    → buildAttestation + verifyAttestation (RE-DERIVED, never trusted)
canonical governed record
   ↓ private CanonicalRecordStore (P05-04, UNCHANGED, ENCAPSULATED)
downstream consumers ← only via canonicalRecords() / isAttested() / auditBoundary()
```

⚠ **The boundary exposes NO method that accepts a pre-built record.** Measured public surface:
`acceptRaw, admit, attestations, auditBoundary, canonicalCount, canonicalRecords, events,
isAttested, rawCount` — and **zero** methods matching `ingest|put|insert|setRecord|addRecord|^set$|^add$`.
The store is a **private field** (`'store' in boundary === false`). **That absence IS the
architectural enforcement**: canonical admission *requires* a `rawRef` plus a declared mapping.

---

## 4. Exit-criteria results — exact

| Tracker criterion | Result |
|---|---|
| **Entry** — *Pipeline exists* | ✅ **MET** — P06-01 complete |
| **Exit** — ***Raw data never bypasses validation*** | ✅ **MET** — **31 bypass attempts EXECUTED at evidence-generation time; 31 REFUSED; 0 NOT BLOCKED.** Malformed raw reaching canonical storage: **0**. Boundary audit after the governed path: **`ok: true`** |
| **Test / Validation** — *Architecture + negative tests* | ✅ **MET** — `p06/tests/rawCanonicalBoundary.test.js`, **25 tests** |
| **Evidence** — *Boundary evidence* | ✅ **MET** — `p06/evidence-p06-02/` (6 files) |

### 4.1 Bypass attempts executed and refused (31)

| Category | Count | Examples of the actual thrown error |
|---|---|---|
| raw → canonical storage | 2 | `[MR-2] admit: a DECLARED mapping is required` · `[M-2, ST-1, FD-1] canonical-shape: not an object / no canonical field map` |
| raw → engine | 3 | `[M-1, INT-013] engine-input: a RAW envelope may never be offered to an engine` · `[ST-1, AD-6] snapshotId 'undefined' is not the frozen form` |
| impostor canonical records | 12 | `[ST-11, FD-1]` · `[ST-9]` · `[C1, FD-1]` · `[ST-1, AD-6]` · `[ST-10] not frozen` · `[M-4]` for each of `extras, rawPayload, nativePayload, metadata, bag, additionalProperties, raw` |
| attestation forgery / tampering | 6 | `[M-2, M-3] does not re-derive` (tampered digest · wrong raw · wrong mapping · wrong schema version) · `[M-2] validation is never waived` (×2) |
| raw-compartment discipline | 2 | `[M-1] no raw payload is held for rawRef 'never-accepted'` · `[M-1] append-only and never overwritten` |
| **malformed raw end-to-end** | 6 | `ccy:'US$'`→SM-1 · `tradePrice:'not-a-number'`→NP-2 · `'101.259'`@p2→NP-3 · `bidSz:500.5`→SM-6 · `sessionDate:'02/03/2026'`→TS-1 · `pe:'18.40.1'`→NP-2 |

Every malformed case was refused at `stage: 'admit-validation'` with `reachedCanonicalStorage: 0`
and `auditStillOk: true`.

### 4.2 Two implementation defects found while testing, and fixed

| Defect | Fix |
|---|---|
| `assertCanonicalShape`'s M-3 scan did **not** strip canonical keys first, so `MD:price.venueRef` false-positived on the provider element `venue` | Now strips canonical keys and matches on **word boundaries**, exactly as the P06-01 engine guard does — so `venueRef` is not mistaken for `venue`, while a name smuggled into `'chain-with-sym-inside'` **is** caught |
| `verifyAttestation` crashed with a `TypeError` when a field was `undefined` on either side — a **fail-open-shaped accident** | Now null-safe: an absent field is a **MISMATCH**, not a crash. The `validationPassed !== true` check also moved **first**, so the informative *"validation is never waived"* branch is reachable instead of being masked by the generic re-derivation message |

---

## 5. Test result — **344 / 344 PASS**

```
cd p05 && node --test "tests/**/*.test.js"      # 264 tests, 264 pass, 0 fail  (unchanged)
cd p06 && node --test "tests/**/*.test.js"      #  80 tests,  80 pass, 0 fail
```

| Suite | Tests |
|---|---|
| `p05/` | **264** (unchanged) |
| `p06/tests/normalization.test.js` (P06-01) | **55** |
| `p06/tests/rawCanonicalBoundary.test.js` **(NEW, P06-02)** | **25** |
| **TOTAL** | **344** |

New P06-02 groups: **A** architecture (5) · **P** positive paths (4) · **N** negative/bypass (10) ·
**D** P06-01 determinism preserved (2) · **S** scope boundary (4).

**0 pre-existing tests removed · net assertion counts did not decrease** — every pre-existing P05
test file is **+0** except `existing-iips-boundary.test.js` (**36 → 37**) and P06-01's
`normalization.test.js` (**142 → 144**).

⚠ **Precisely: 3 assertion *statements* were textually REPLACED**, each equal-or-stronger:

| # | Replaced | Replacement | Net |
|---|---|---|---|
| 1 | `assert.match(f, /^P06_01_/)` (docs/p06 prefix) | `assert.match(f, /^P06_0[12]_/)` — **P06-03 remains barred** | equal intent, P06-02 now permitted |
| 2 | `assert.doesNotMatch(code, /class\s+\w*(RawStore\|RawPayloadStore\|StorageBoundary)/)` in `existing-iips-boundary.test.js` | the boundary is now authorized; replaced by **2 NEW universal clauses** — nothing in `p06/src` may persist to disk, and nothing may implement a `bypass(Validation\|Detection)` surface. The P06-03 dedup ban is **retained** | **stronger** |
| 3 | the same clause in P06-01's `normalization.test.js` B/3 | rescoped to the **three enumerated P06-01 modules**, plus **2 NEW clauses** — a P06-01 module may not implement the boundary *and* may not reach `CanonicalRecordStore` at all; the module enumeration is itself asserted | **stronger** |
| 4 | `assert.deepEqual(allTracked.filter((f) => /P06[_-]0[23]/.test(f)), [])` (barred P06-02 **and** P06-03) | `/P06[_-]03/` — P06-02 now permitted, **P06-03 still barred** | equal intent |
| 5 | `assert.match(f, /^P06_01_/)` — the **`no-provider-dependency.test.js` D10 guard's** own `docs/p06` prefix clause | `^P06_0[12]_` — **P06-03 still barred**; its recursive whole-`docs/` acceptance-artifact scan is unchanged | equal intent |

---

## 6. ⚠ Evidence classification — the four kinds, kept strictly apart

| Kind | Produced here? | Where |
|---|---|---|
| **Implementation** | ✅ **YES** | `p06/src/rawCanonicalBoundary.js`, 344 passing tests |
| **Local / synthetic test** | ✅ **YES** — this is what the boundary evidence is | `p06/evidence-p06-02/` |
| **Contract / lifecycle** | ⚠ **NO — unchanged** | P05-02 / P05-03 remain specification + adapter-contract only |
| **Provider execution** | ❌ **ABSENT — AND MUST REMAIN ABSENT** | No provider selected, named, contacted or bound. No credential or entitlement. No network call. **`NOT_AUTHORIZED`** (D9 **N-1**, D10 §8.2) |

⚠ Every artifact carries `classification.isProviderEvidence: false` and `phaseScope: "P06-02"`.
`provider-register.json` is **unmodified** with exactly **1** `LOCAL_FIXTURE` identity.

---

## 7. ⚠ P06-03 is NOT implemented — how the boundary is enforced

| Work item | Deliverable | Status |
|---|---|---|
| **P06-01** | Normalization pipeline | ✅ complete, **preserved** — every admitted record is **byte-identical** to the P06-01 pipeline's own output for the same payload (test **P/3**) |
| **P06-02** | **Storage boundary** | ✅ **implemented** |
| **P06-03** | **Deduplication rules** | ❌ **NOT implemented** |

No deduplication rule, duplicate key, cross-provider merge or idempotency key exists in the P06
package. The store's own idempotency is a **P05-04 property that is INHERITED, not extended**.
Asserted by `rawCanonicalBoundary.test.js` **S/1** and by the P05 guard.

Also **NOT** done: no scheduling / retries / checkpointing (that is P05-04, unchanged) · **no disk
persistence** of raw or canonical data · no P11 engine-input mapping.

---

## 8. ⚠ Recorded limitations — first-class content, not omissions

| # | Limitation |
|---|---|
| **L-1** | **Not exercised against a live provider** — synthetic local payloads only. A **standing non-authorization** (D9 N-1, D10 §8.2), **not** a P06-02 defect |
| **L-2** | **The attestation is a RE-DERIVABLE binding, NOT a cryptographic proof.** There is no secret in this system and none may be added (no credentials, D10 §8.2). `verifyAttestation` re-executes the governed path from the raw payload + declared mapping and requires **byte-identity**, so admission requires a raw payload and mapping that genuinely produce the record. The property enforced is **provenance-through-the-boundary, not authenticity against an adversary** |
| **L-3** | **The accepted P05-04 `CanonicalRecordStore` is deliberately UNCHANGED.** Instantiated **bare**, outside the governed architecture, it still ingests any object carrying a `snapshotId` (BP-1). The boundary **encapsulates** it in a private field, exposes no bare-record door, and `auditBoundary()` **detects** contamination. So what is delivered is **prevention-by-architecture within the governed path, plus detection** — not a change to a P05-04 component this act is not authorized to alter |
| **L-4** | **The raw compartment is IN-MEMORY.** No raw payload is persisted, so there is no raw-data-at-rest surface. A durable raw store is **not claimed** and would raise separate governance questions |
| **L-5** | Three declared mappings exist (D01 quote/close/valuation), inherited from P06-01. **D02–D10 are NOT declared**, so the boundary is demonstrated over **D01 only** |
| **L-6** | **P06-02 completion is NOT P06 gate acceptance, NOT certification, NOT provider authorization and NOT production activation** (D10-6) |

---

## 9. ⚠ Disclosure — two existing governance guards were superseded, not weakened

| Guard | Change |
|---|---|
| `p05/tests/existing-iips-boundary.test.js` — *`'P07 / P08 remain untouched; P06 exists ONLY as authorized P06-01 work'`* | **P07 and P08 arms UNCHANGED.** The P06 arm widens from `^P06_01_` to `^P06_0[12]_` because **D10-2 authorizes P06-02 and it is now implemented** — while **P06-03 remains barred**, which is the part of the original intent that still bites. **Two NEW universal clauses added**: nothing in `p06/src` may persist to disk, and nothing may implement a raw-bypass surface. Retitled accordingly |
| `p06/tests/normalization.test.js` **B/3** | Rescoped from "every `p06/src` file" to the **three enumerated P06-01 modules**, and **tightened**: a P06-01 module may neither implement the boundary **nor reach `CanonicalRecordStore` at all**, and the module enumeration is itself asserted so a fourth P06-01 module or a second boundary module fails |
| `p05/tests/no-provider-dependency.test.js` D10 guard | Its `docs/p06` prefix clause widens `^P06_01_` → `^P06_0[12]_` on the same basis (**P06-03 remains barred**). Its recursive whole-`docs/` scan for a P06 acceptance artifact is **UNCHANGED** |

**Negative-tested (each guard proven to have teeth):**

| Mutation | Result |
|---|---|
| add `docs/p06/P06_03_EVIDENCE.md` | **2 P05 guards FAIL** |
| add `docs/p06/P06_GATE_ACCEPTANCE.md` | **2 P05 guards FAIL** |
| smuggle `class SneakyStorageBoundary` into a P06-01 module | **P06-01 B/3 FAILS** |
| add `deduplicateAcrossProviders()` to the P06-02 boundary | **1 P05 guard + P06-02 S/1 FAIL** |
| control restored | **all pass** |

---

## 10. Gate position — UNCHANGED

| Field | Status |
|---|---|
| `formal_gate_status` | **6 of 18 accepted — P00, P01, P02, P03, P04, P05** *(unchanged — this act accepts no gate)* |
| `p06_02_status` | **`IMPLEMENTED + EVIDENCED`** *(was `NOT STARTED`)* — limitations **L-1…L-6** recorded |
| `p06_01_status` | **`IMPLEMENTED + EVIDENCED`**, preserved (admitted records byte-identical) |
| `p06_03_status` | **`AUTHORIZED` for entry, NOT implemented** |
| `p06_acceptance_status` | **`NOT_ACCEPTED`** — **no `P06_GATE_ACCEPTANCE.md` exists**, and none is created (**D10-6**) |
| `p06_a3_gate_acceptor` | **Ramakrishnan V. S. (Ramki)** (**D10-3**), scoped to **P06**. ⚠ **Designation ≠ acceptance** |
| `p05_02_live_provider_execution` | **`NOT_AUTHORIZED`** (D9 N-1) |
| `licensed_historical_acquisition` | **`NOT_AUTHORIZED`** (D9 N-2) |
| `production_activation_status` | **`NOT_AUTHORIZED`** (A4 at P16 only) |
| `certification_status` | **`NONE_GRANTED`** |
| `track_b_to_main_merge` | **`NOT AUTHORIZED`** |

### 10.1 What this act did NOT do

No **P06-03** deduplication or idempotency rules · no P06 acceptance artifact · no certification ·
no production activation · no provider selection / entitlement / credential / provider
configuration · no licensed historical acquisition · **no scheduling, retries or checkpointing**
(P05-04, unchanged) · **no disk persistence** of raw or canonical data · **no Track B →
`origin/main` merge** · no edit to any historical P00–P05 authority record · no variation of
**ADR-01 C1–C6** · no change to the **`MD:`** token · **no P11 engine-input mapping** · no
existing-IIPS modification · **no change to the accepted P05-04 `CanonicalRecordStore`** ·
**no concessions register**.

### 10.2 Open items — unchanged

`OI-P04-03` · `OI-P04-04` · `DEP-P01-04` · `OI-D9-01` · `M-1 / AD-4` · `M-5` (blocks C12
certification) · `M-6` · `AD-17 / M-2` · **PIT-1…PIT-7 MISSING / NOT DEMONSTRATED** (travels to P08
undischarged).

---

## 11. P06-02 completion — precise meaning

**P06-02 is COMPLETE within the D10-2 authorized boundary**: its authoritative exit criterion
(*"Raw data never bypasses validation"*) is demonstrated by **31 executed bypass attempts, all
refused**; its *Test / Validation* artifact exists (*architecture + negative tests*, 25); and its
*Evidence* artifact exists (*boundary evidence*, 6 files).

⚠ **Read with L-1…L-5.** In particular **L-2** (the attestation is provenance, not authenticity) and
**L-3** (the P05-04 store is unchanged; prevention is by architecture + detection within the
governed path).

⚠ **P06-02 completion is NOT P06 acceptance, NOT certification, NOT provider authorization and NOT
production activation** (L-6 / D10-6).

### 11.1 Exact next governance-safe step

**P06-03 — deduplication / idempotency** is the next step. It is already entry-authorized by D10-2,
and both of its Hard dependencies are now satisfied: `P06-01` and `P06-02`. Entry criterion:
*"Canonical schema stable."* Exit criterion: *"Repeated ingestion stable."*

⚠ **P06-03 remains a separately governed work item** despite existing entry authorization. A P06
acceptance remains a **separate explicit act** by the designated A3 acceptor (**Ramki**, D10-3)
carrying the `P00_GATE_MODEL.md`:42 minimum evidence — *"Token recorded; C1–C6 collision guard
evidence; 13-engine oracle byte-identity"* — plus ADR-01 §G evidence.

## 12. Evidence package — `p06/evidence-p06-02/` (6 files)

| File | Content |
|---|---|
| `00-INDEX.json` | index, authority, tracker row, exit-criteria assessment, gate status |
| `01-bypass-inventory-before.json` | the **5 measured bypass paths** as they were at `b6160cb`, with executed proofs |
| `02-governed-path.json` | the architecture, the measured API surface, 5 admissions, separation + audit results |
| `03-bypass-results.json` | **31 executed bypass attempts**, each with the actual thrown error, plus the summary and the exit-criterion verdict |
| `04-scope-boundary.json` | P06-01 preserved · P06-03 **NOT** implemented · what else was not done |
| `05-limitations-and-open-items.json` | L-1…L-6, unchanged open items, what this act did not do |

**Determinism:** regenerating produces **byte-identical** output (verified, `diff -r -q`).
`00-INDEX.json` records a `sha256` per file.

Reproduce: `cd p06 && npm run evidence:p06-02`.
