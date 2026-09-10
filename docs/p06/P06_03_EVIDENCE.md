# P06-03 — EVIDENCE RECORD (deduplication / idempotency)

> **Authority: D10-2** — `docs/p00/P00_DECISION_LOG.md` §8.1, commit
> `b41240c406914f34f06c2f7bc3986bdeb436018d`: ***"P06 ENTRY is AUTHORIZED … Scope = `P06-01`,
> `P06-02`, `P06-03` ONLY."***
>
> ⚠ **This is the LAST of the three P06 work items authorized by D10-2.** P06-01 and P06-02 are
> complete and are **preserved unchanged** by this act.
>
> ⚠ **All three work items being complete does NOT accept the gate.** **P06 remains
> `NOT_ACCEPTED`**; no `P06_GATE_ACCEPTANCE.md` exists or is created (**D10-6**).
>
> ⚠ **This record is ADDITIVE.** It edits no historical authority record.

---

## 1. The authoritative scope — taken from the repository, not invented

`Work Tracker`!P06-03 (TRACKER, unmodified):

| Field | Value |
|---|---|
| Work Item | **Deduplication/idempotency** |
| Requirement | **Prevent duplicate records across retries/replays/providers.** |
| Deliverable | **Deduplication rules** |
| Dependencies | `P06-01,P06-02` (Hard) — **both COMPLETE** |
| Entry Criteria | **Canonical schema stable** |
| Exit Criteria | **Repeated ingestion stable** |
| Test / Validation | **Replay tests** |
| Evidence | **Replay evidence** |
| Critical Path | YES |

---

## 2. ⚠ The deduplication identity — TAKEN FROM EXISTING CONTRACTS, NOT INVENTED

The tracker requires dedup across *retries / replays / providers*. The identity used is the one the
accepted corpus already fixes. **No new formula, no added component, no alternative key.**

| Component | Authoritative source |
|---|---|
| **`snapshotId = data-${provider}-${dataVersion}-${asOf}`** | **AD-6** — format frozen, authoritative for the market-data input layer · `P01_DATA_CONTRACT.md` §3.1 row 1 and §6 · **`P05_03_SPECIFICATION.md`:84 — *"no component added"*** |
| **`dataVersion`** = the vintage of the **source content** | **DV-1** · `P01_VERSIONING_COMPATIBILITY.md` **V2** · a correction is a **new `dataVersion`**, never an edit (**INV-2**, **DV-3**) |
| **`canonicalDigest(record)`** | **RI-6** — deterministic serialization (canonical key order, ISO-8601 UTC at fixed precision, stable numerics) |
| The **decision rule** | The **accepted P05-04 `CanonicalRecordStore`**: `(snapshotId, canonicalDigest)` → `INSERTED` \| `IDEMPOTENT_NOOP` \| `CONFLICT_REJECTED` |

### 2.1 ⚠ The existing mechanism was REUSED, not duplicated or replaced

**An idempotency mechanism already existed** — the P05-04 `CanonicalRecordStore` — and it is the
authoritative one. Measured before this act: ingesting the 5-case corpus twice gave `5 INSERTED`
then `5 IDEMPOTENT_NOOP` with the count staying at 5. **P06-03 does not build a second store.** It
supplies what the tracker actually names as the deliverable — **deduplication *rules*, declared as
data** — plus a decision layer that makes the outcome observable and provable, sitting downstream
of the P06-02 boundary.

### 2.2 ⚠ Cross-provider records are deliberately NOT collapsed

`P04_CANONICAL_SECURITY_MODEL.md` **PN-5**: *"two providers asserting the same instrument produce
ONE canonical security ID with per-source attribution. **Never two canonical identities, never a
silent merge.**"* And `P01_IDENTITY_AND_LINEAGE.md` **RI-3**: *"provider identity is **never
flattened away**."* Two providers' observations of the same instrument are **distinct records**,
correctly attributed — deduplicating them would be the prohibited silent merge. So *"across
providers"* is satisfied by (a) suppressing a re-presented record of the **same** provider vintage,
and (b) **proving** distinct-provider records stay distinct.

**`RJ-6`** prohibits without exception: silent overwrite · precedence rules · "last wins" · dropping
a field · substituting a value.

---

## 3. The declared rules — the deliverable

`p06/src/deduplicationRules.js` exports `DEDUPLICATION_RULES`, inspectable as data (the discipline
P02 **M-6**/**MR-4** imposes on mappings). Every rule states a condition, a decision and the
**authority** it derives from:

| Rule | Condition | Decision | Authority |
|---|---|---|---|
| **DD-1** | no existing record carries this `snapshotId` | `INSERTED` | P05-04 `CanonicalRecordStore.ingest` — reused |
| **DD-2** | same `snapshotId` **and** same `canonicalDigest` | `IDEMPOTENT_NOOP` | P05-04 — the tracker's retries/replays axis |
| **DD-3** | same `snapshotId`, **different** content | `CONFLICT_REJECTED` | **INV-2** · **RJ-6** |
| **DD-4** | different `snapshotId` (provider, `dataVersion` or `asOf` differs) | `INSERTED` | **PN-5** · **RI-3** · **DV-1/DV-3** |
| **DD-5** | `boundary.isAttested(record) !== true` | `REJECTED_NOT_ATTESTED` | **P06-02** exit criterion — P06-03 must not become a second admission path |
| **DD-6** | `assertCanonicalShape(record)` fails | `REJECTED_NOT_CANONICAL` | **M-1…M-4** · **C1/FD-1** · **ST-10** |

## 4. The governed path — P06-03 sits downstream, and cannot become a second raw path

```
raw → P06-02 raw/canonical boundary → P06-01 normalization → canonical governed record
    → P06-03 deduplication rules → stable canonical result
```

⚠ **`DeduplicationLedger` cannot be constructed without a boundary**, and `record()` refuses
anything the boundary has not attested (**DD-5**) and anything that is not a governed canonical
record (**DD-6**). There is therefore **no second raw-ingestion path**.

---

## 5. Exit-criteria results — exact, and MEASURED

| Tracker criterion | Result |
|---|---|
| **Entry** — *Canonical schema stable* | ✅ **MET** — P06-01 and P06-02 complete |
| **Exit** — ***Repeated ingestion stable*** | ✅ **MET** — see §5.1 |
| **Test / Validation** — *Replay tests* | ✅ **MET** — `p06/tests/deduplication.test.js`, **33 tests** |
| **Evidence** — *Replay evidence* | ✅ **MET** — `p06/evidence-p06-03/` (6 files, byte-reproducible) |

### 5.1 Repeated ingestion of the exact same canonical corpus — measured over 5 passes

| Measurement | Value |
|---|---|
| corpus size | **5** canonical records |
| **first-ingestion inserts** | **5** |
| **second-and-later ingestion inserts** | **[0, 0, 0, 0]** |
| **final canonical count** | **5** |
| **duplicate / no-op count** | **20** |
| canonical set digest per pass | **one distinct value across all 5 passes** — byte-identical |
| `exitCriterionMet` | **true** |

### 5.2 The three requirement axes — each executed

| Axis | Measured | Result |
|---|---|---|
| **Retries** | the identical payload re-acquired under a **new `rawRef`**: `INSERTED` then `IDEMPOTENT_NOOP`, record count **1** | ✅ |
| **Replays** | the whole corpus re-presented **3×**: pass 1 `5` inserts, passes 2–3 **`0`**, final count **5** | ✅ |
| **Providers** | **5 distinct identity keys for 5 records**; every key retains its provider component (`data-localfix-…`). Vintage axis: `CS-LOCAL-0001` holds **4 vintages → 4 distinct `snapshotId`s, not collapsed** | ✅ |

### 5.3 Distinctness, conflicts and bypass — executed

| Check | Measured |
|---|---|
| **DD-4** distinct records not collapsed | offered **5**, inserted **5**, `IDEMPOTENT_NOOP` **0**, distinct keys **5** |
| **DD-3** conflict (reused P05-04 store) | `INSERTED` → `IDEMPOTENT_NOOP` → **`CONFLICT_REJECTED`**; store size **1**; **the original survives unchanged** (no "last wins") |
| Identity / vintage preserved | `canonicalSecurityId`, `canonicalIssuerId`, `mappedCompanyId`, `dataVersion`, `asOf`, `provider`, `lineage.sourceRef` all preserved; **FIGI is the sole `AUTHORITATIVE` identifier** on every record; all field keys namespaced |
| **Bypass attempts** | **10 executed, 10 REFUSED, 0 not blocked** — an unattested canonical record (**DD-5**), all 5 raw payloads (**DD-5**), a raw payload dressed with a `snapshotId` (**DD-5**), a ledger built with no boundary (**DD-5**), a non-canonical object (**DD-6**), a malformed `snapshotId` (**AD-6**) |

---

## 6. Test result — **377 / 377 PASS**

```
cd p05 && node --test "tests/**/*.test.js"      # 264 tests, 264 pass, 0 fail  (unchanged)
cd p06 && node --test "tests/**/*.test.js"      # 113 tests, 113 pass, 0 fail
```

| Suite | Tests |
|---|---|
| `p05/` | **264** (unchanged) |
| `p06/tests/normalization.test.js` (P06-01) | **55** |
| `p06/tests/rawCanonicalBoundary.test.js` (P06-02) | **25** |
| `p06/tests/deduplication.test.js` **(NEW, P06-03)** | **33** |
| **TOTAL** | **377** |

New P06-03 groups: **A** declared rules (2) · **I** dedup identity (4) · **D** exit criterion /
repeated ingestion (5) · **N** distinctness, vintage, FIGI (3) · **F** conflicts / RJ-6 (4) ·
**G** cannot bypass P06-02 (6) · **P** P06-01/P06-02/C1–C6 intact (4) · **S** scope (5).

**0 pre-existing tests removed · net assertion counts did not decrease** — every pre-existing P05
file is **+0**, and `p06/tests/normalization.test.js` rises only by the rescoped guard's own new
assertions.

⚠ **Precisely: 6 assertion *statements* were textually REPLACED (6 deleted assertion lines,
measured)**, each equal-or-stronger. Enumerated exactly as they appear in the diff:

| # | File | Replaced assertion | Replacement | Net |
|---|---|---|---|---|
| 1 | `existing-iips-boundary.test.js` | `assert.match(f, /^P06_0[12]_/)` | `^P06_0[123]_` — the **complete** D10-2 scope; the tracker defines no fourth P06 work item | equal intent |
| 2 | `existing-iips-boundary.test.js` | `assert.deepEqual(allTracked.filter((f) => /P06[_-]03/.test(f)), [])` | `/P06[_-]0[4-9]/` — **newly bars a fourth P06 work item**, which the old clause could not express | **stronger** |
| 3 | `existing-iips-boundary.test.js` | `assert.doesNotMatch(code, /dedup\|deduplicat\|crossProviderMerge\|idempotencyKey/i)` applied to **every** module | the same clause made conditional on `f !== 'deduplicationRules.js'`; the **universal** *no disk persistence* and *no raw-bypass surface* clauses are **retained verbatim and still bind every module** | equal intent |
| 4 | `normalization.test.js` **B/3** | `assert.deepEqual(present, [...P06_01_SOURCE_FILES, P06_02_BOUNDARY_FILE].sort())` | the list gains the single P06-03 module — a **fourth work item or any stray module still fails** | equal intent |
| 5 | `normalization.test.js` **B/4** | `assert.doesNotMatch(code, /dedup\|…\|idempotencyKey/i)` applied to **every** module | dedup permitted in **exactly one** file and barred from all others **including the P06-02 boundary**; **plus a NEW assertion** proving the P06-03 module really does implement it, so the rescope is demonstrably not a deletion | **stronger** |

| 6 | `no-provider-dependency.test.js` D10 guard | `assert.match(f, /^P06_0[12]_/)` | `^P06_0[123]_` — the **complete** D10-2 scope. ⚠ This clause was missed on the first pass and was caught only when the P05 suite dropped to 263/264 after `P06_03_EVIDENCE.md` was created; it is disclosed here rather than silently patched. The guard's recursive whole-`docs/` **P06-acceptance-artifact ban is UNCHANGED**, and it still fails on a `P06_04_*` artifact and on a `P06_GATE_ACCEPTANCE.md` (both negative-tested) | equal intent |

One further change is a **condition**, not a deleted assertion: **B/3**'s inner
*"must not reach `CanonicalRecordStore`"* clause is now bound to the **three P06-01 modules** (the
test's stated intent — a P06-03 rule legitimately *cites* the reused P05-04 store by name), and a
**NEW universal clause** was added requiring the boundary class to exist **only** in the P06-02
module.

---

## 7. ⚠ Evidence classification — the four kinds, kept strictly apart

| Kind | Produced here? | Where |
|---|---|---|
| **Implementation** | ✅ **YES** | `p06/src/deduplicationRules.js`, 377 passing tests |
| **Local / synthetic test** | ✅ **YES** — this is what the replay evidence is | `p06/evidence-p06-03/` |
| **Contract / lifecycle** | ⚠ **NO — unchanged** | P05-02 / P05-03 remain specification + adapter-contract only |
| **Provider execution** | ❌ **ABSENT — AND MUST REMAIN ABSENT** | No provider selected, named, contacted or bound. No credential or entitlement. No network call. **`NOT_AUTHORIZED`** (D9 **N-1**, D10 §8.2) |

⚠ Every artifact carries `classification.isProviderEvidence: false`, `phaseScope: "P06-03"` and
`p06Acceptance: false`. `provider-register.json` is **unmodified** with exactly **1**
`LOCAL_FIXTURE` identity.

---

## 8. ⚠ Recorded limitations — first-class content, not omissions

| # | Limitation |
|---|---|
| **L-1** | **Not exercised against a live provider** — synthetic local canonical records only. A **standing non-authorization** (D9 N-1, D10 §8.2), **not** a P06-03 defect |
| **L-2** | **Cross-PROVIDER distinctness is demonstrated STRUCTURALLY**, from the frozen **AD-6** identity form (the provider is a component of `snapshotId`), **not** by executing a second provider. No second provider identity may be issued under the current authority (D10 §8.2), so a two-provider corpus was **not** run |
| **L-3** | **The P06-02 attestation gate is CONTENT-based** (a canonical digest). A party able to construct a **byte-identical** canonical record by hand would satisfy DD-5. The property enforced is **provenance-through-the-boundary, NOT authenticity against an adversary** — there is no secret and none may be added. This is **P06-02 L-2, inherited** |
| **L-4** | **The ledger is IN-MEMORY.** No deduplicated canonical set is persisted; no durable store, no raw-at-rest surface. Durable persistence is **not claimed** and is not part of the P06-03 contract (P08 owns storage decisions — `DEP-P01-04`) |
| **L-5** | Three declared mappings exist (D01 quote/close/valuation), inherited from P06-01. **D02–D10 are NOT declared**, so deduplication is demonstrated over **D01 only** |
| **L-6** | **P06-03 completion is NOT P06 gate acceptance, NOT certification, NOT provider authorization and NOT production activation** (D10-6) |

---

## 9. ⚠ Disclosure — guards superseded, not weakened

Four assertion statements were replaced (tabulated in §6). In every case:

- **P07 and P08 restrictions are UNCHANGED** — `docs/p07` / `docs/p08` must still not exist, and no
  P07/P08 artifact may be tracked.
- The **existing-IIPS boundary is UNCHANGED** — the filename check is byte-for-byte identical.
- The **universal clauses were retained and still bind every module** — nothing in `p06/src` may
  persist to disk, and nothing may implement a raw-bypass surface.
- **What is now barred that was not before:** any `P06[_-]0[4-9]` artifact — the accepted tracker
  defines no fourth P06 work item.

**Negative-tested (each guard proven to have teeth):**

| Mutation | Result |
|---|---|
| add `docs/p06/P06_04_EVIDENCE.md` (no such work item) | **2 P05 guards FAIL** |
| add `docs/p06/P06_GATE_ACCEPTANCE.md` | **2 P05 guards FAIL** |
| smuggle `deduplicateSneaky()` into the **P06-02 boundary** | **1 P05 guard + P06-01 B/4 FAIL** |
| add a stray 5th module to `p06/src` | **P06-01 B/3 + P06-03 S/5 FAIL** |
| add `import { writeFileSync } from 'node:fs'` to the P06-03 module | **1 P05 guard FAILS** (universal clause) |
| control restored | **all pass** |

---

## 10. Gate position — UNCHANGED

| Field | Status |
|---|---|
| `formal_gate_status` | **6 of 18 accepted — P00, P01, P02, P03, P04, P05** *(unchanged — this act accepts no gate)* |
| `p06_03_status` | **`IMPLEMENTED + EVIDENCED`** *(was `NOT STARTED`)* — limitations **L-1…L-6** recorded |
| `p06_01_status` / `p06_02_status` | **`IMPLEMENTED + EVIDENCED`**, preserved |
| `p06_acceptance_status` | **`NOT_ACCEPTED`** — **all three work items are complete but the GATE is NOT accepted**; **no `P06_GATE_ACCEPTANCE.md` exists**, and none is created (**D10-6**) |
| `p06_a3_gate_acceptor` | **Ramakrishnan V. S. (Ramki)** (**D10-3**), scoped to **P06**. ⚠ **Designation ≠ acceptance** |
| `p05_02_live_provider_execution` | **`NOT_AUTHORIZED`** (D9 N-1) |
| `licensed_historical_acquisition` | **`NOT_AUTHORIZED`** (D9 N-2) |
| `production_activation_status` | **`NOT_AUTHORIZED`** (A4 at P16 only) |
| `certification_status` | **`NONE_GRANTED`** |
| `track_b_to_main_merge` | **`NOT AUTHORIZED`** |

### 10.1 What this act did NOT do

No **P07 or P08** implementation (no freshness/staleness, no PIT storage, no adjusted/unadjusted
series, no corporate actions) · **no P06 acceptance artifact** · no certification · no production
activation · no provider selection / entitlement / credential / provider configuration · no licensed
historical acquisition · **no scheduling, retries or checkpointing** (P05-04 unchanged) · **no
durable persistence** · **no Track B → `origin/main` merge** · no edit to any historical P00–P05
authority record · no variation of **ADR-01 C1–C6** · no change to the **`MD:`** token · **no change
to the AD-6 `snapshotId` form (no component added)** · **no P11 engine-input mapping** · no
existing-IIPS modification · **no change to the accepted P05-04 `CanonicalRecordStore`** · **no
second raw-ingestion path** · **no concessions register**.

### 10.2 Open items — unchanged

`OI-P04-03` · `OI-P04-04` · `DEP-P01-04` · `OI-D9-01` · `M-1 / AD-4` · `M-5` (blocks C12
certification) · `M-6` · `AD-17 / M-2` · **PIT-1…PIT-7 MISSING / NOT DEMONSTRATED** (travels to P08
undischarged).

---

## 11. P06-03 completion — precise meaning

**P06-03 is COMPLETE within the D10-2 authorized boundary**: its authoritative exit criterion
(*"Repeated ingestion stable"*) is demonstrated by measurement (5 passes, `[0,0,0,0]` later inserts,
byte-identical canonical set); its *Test / Validation* artifact exists (*replay tests*, 33); and its
*Evidence* artifact exists (*replay evidence*, 6 files).

⚠ **Read with L-1…L-5.** In particular **L-2** (cross-provider distinctness is structural, not
executed against a second provider) and **L-3** (the attestation gate is provenance, not
authenticity).

⚠ **All three P06 work items are now complete — and P06 is still `NOT_ACCEPTED`.** Completion of
the work items is **not** gate acceptance, **not** certification, **not** provider authorization and
**not** production activation (L-6 / D10-6).

### 11.1 Exact next governance-safe step

**There is no further P06 implementation work item.** The accepted tracker defines exactly three,
and all three are now complete. The next governance-safe step is therefore **an authority act, not
an implementation act**:

**A separate, explicit P06 gate-acceptance decision by the designated A3 acceptor — Ramakrishnan
V. S. (Ramki), D10-3** — carrying the `P00_GATE_MODEL.md`:42 minimum evidence (*"Token recorded;
C1–C6 collision guard evidence; **13-engine oracle byte-identity**"*) plus **ADR-01 §G** evidence.

⚠ **This act must NOT be inferred from work-item completion, and was NOT performed here.** Note
that the **13-engine oracle byte-identity** element of that minimum evidence concerns existing-IIPS
engines and is **outside** everything implemented in P06; it is an authority/evidence question for
the acceptor, not something this act could supply.

If instead further **implementation** is desired, the next authorized-in-tracker phases beyond P06
are **P07** (data quality / freshness) and **P08** (historical / PIT) — **neither is authorized for
entry today**, and neither was touched by this act.

## 12. Evidence package — `p06/evidence-p06-03/` (6 files)

| File | Content |
|---|---|
| `00-INDEX.json` | index, authority, tracker row, exit-criteria assessment, **headline measurements**, gate status |
| `01-deduplication-rules.json` | **the deliverable** — DD-1…DD-6, the identity and its sources, the prohibitions, the reuse statement |
| `02-exit-criterion-repeated-ingestion-stable.json` | the **measured** 5-pass replay: inserts per pass, final count, no-ops, per-pass canonical digests, self-audit |
| `03-requirement-axes.json` | the **retries / replays / providers** axes, each executed, with the vintage-axis analysis |
| `04-distinctness-conflicts-bypass.json` | DD-4 distinctness, identity/vintage/FIGI preservation, the DD-3 conflict sequence, and **10 executed bypass attempts** |
| `05-scope-and-limitations.json` | L-1…L-6, what is not implemented, unchanged open items, what this act did not do |

**Determinism:** regenerating produces **byte-identical** output (verified, `diff -r -q`).
`00-INDEX.json` records a `sha256` per file.

Reproduce: `cd p06 && npm run evidence:p06-03`.
