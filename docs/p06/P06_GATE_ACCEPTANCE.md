# P06 — GATE ACCEPTANCE RECORD

> **Explicit acceptance act** required by the governing rule
> **"Explicit gate acceptance; no automatic promotion."** (TRACKER `Phase Gates!P06`)
> Acceptance is not inferred from work-package completion, from a passing review, from evidence
> availability, or from authority clearance; it is performed here by the designated **A3** acceptor.

> ⚠ **This record accepts the P06 gate. It does NOT complete, execute or authorize any work item
> beyond the three that D10-2 authorized (`P06-01`, `P06-02`, `P06-03`).** The distinctions drawn in
> §5 are part of the act and are not decoration: an accepted gate status, existing evidence, missing
> evidence, unauthorized work, unresolved decisions and open items are six different things and are
> recorded as six different things.

---

## 1. Acceptance record

| Field | Value |
|---|---|
| **Gate** | **P06** |
| **Gate name** | **Canonical pipeline gate** |
| **Phase** | P06 — Normalize provider payloads into governed canonical form |
| **Result** | # **ACCEPTED** |
| **Acceptance authority** | **A3 — Phase-Gate Acceptance Authority**, scoped to the **P06 gate** by **D10-3** (`docs/p00/P00_DECISION_LOG.md` §8.1, designation date **2026-09-10**) |
| **A3 acceptor** | **Ramakrishnan V. S. (Ramki)** — designated by D10-3, **scoped to P06 only**; ⚠ **P07–P17 are NOT designated** |
| **Acceptance type** | **Explicit A3 acceptance act** — not automatic promotion, not inferred from readiness |
| **Authority decision selected** | **ACCEPT P06** — selected explicitly by the A3 authority after the decision package of §4 was placed before them |
| **Minimum evidence boundary applied** | `docs/p00/P00_GATE_MODEL.md`:42 — *"Token recorded; C1–C6 collision guard evidence; 13-engine oracle byte-identity"* **plus ADR-01 §G evidence** |
| **Prior gates** | P00 ✅ · P01 ✅ · P02 ✅ · P03 ✅ · P04 ✅ · P05 ✅ — **all remain accepted and unchanged** |
| **Prior state** | **P06 = ENTRY AUTHORIZED / NOT_ACCEPTED** — 6 of 18 accepted (D10-6: *"authorization is not acceptance"*) |
| **Resulting state** | **P06 ACCEPTED — 7 of 18** |

⚠ **A3 clearance permits the acceptance *process*; it does not pre-accept any gate**
(`docs/p00/P00_GATE_MODEL.md`:65). This record **is** the acceptance act itself, and it is the
first act to exercise the P06-scoped designation recorded at `P00_DECISION_LOG.md` §8.1 (D10-3).

⚠ **The D10-3 designation was not acceptance.** D10 records that designation *"does **not** confer
**P06 gate acceptance**"* and §8.2 lists **12 explicit non-authorizations** including *"**P06 gate
acceptance** — NOT ACCEPTED"*. That remains accurate as a historical record: designation made
acceptance *possible*; this document performs it. **D10 is left unedited.**

---

## 2. Baseline / pinned commit

| Field | Value |
|---|---|
| **Pinned baseline HEAD** | **`3f79e612e06afcd87f09c199665b12354b233e42`** — *"D12: ADR-01 §B.2 / D4 Part I collision-census authority reconciliation (Ramki/Sai)"* |
| **Parent** | `73f44a3d1cb2005c4657960036cf5351e910f390` — D11 authority act |
| **P06 entry-authorization baseline** | D10 (`docs/p00/P00_DECISION_LOG.md` §8) |
| **P06 implementation commits** | `939504d` P05-04 · `b6160cb` P06-01 · `c82aba6` P06-02 · `2d4092a` P06-03 |
| **Authority chain relied on** | `73f44a3` **D11** (collision guard + M-1 authority act) → `3f79e61` **D12** (census reconciliation) |
| **Existing-IIPS oracle tree** | `ramkivs/iips-review-recovered` @ **`5decdca93e5d3b90ec94ca902ff73af45574a6ac`** (the AD-15 baseline), with the D11 guard and M-1 work as **local commits `64797d6` → `4292fff`, UNPUSHED, no branch created** |
| **Evidence sets relied on** | `p06/evidence-p06-01/` (**9**) · `p06/evidence-p06-02/` (**6**) · `p06/evidence-p06-03/` (**6**) — **21 artifacts**, each byte-reproducible |
| **Implementation relied on** | `p06/src/` **5 modules** (`mappingDeclaration.js` · `normalizationPipeline.js` · `identityResolution.js` · `rawCanonicalBoundary.js` · `deduplicationRules.js`) · `p06/tests/` 4 files · **zero external dependencies, zero network surface** |
| **Test suite at the pinned baseline** | **377 / 377 PASS** (P05 **264** + P06 **113**), `node --test "tests/**/*.test.js"` |
| **Pinned-commit rule** | `docs/p00/P00_EVIDENCE_CONVENTIONS.md` §1.3 — a pinned commit is **Mandatory** |

⚠ **O-4 discipline:** every commit cited above is resolvable in the current object database. No
substitute hash is invented for any act.

---

## 3. Acceptance scope

### 3.1 What is accepted

| # | Accepted |
|---|---|
| 1 | **P06-01 — normalization pipeline** (`docs/p06/P06_01_EVIDENCE.md`, **55 tests**). Exit criterion *"Canonical output deterministic"* **MET**. Provider payloads become governed canonical records through a **declared** mapping vocabulary (MD-1…MD-8), never an ad-hoc transformation. |
| 2 | **P06-02 — raw / canonical storage boundary** (`docs/p06/P06_02_EVIDENCE.md`, **25 tests**). Exit criterion *"Raw data never bypasses validation"* **MET**. Raw payloads live in a `RawCompartment` outside canonical storage; admission requires an attestation; **10 bypass attempts executed, 10 REFUSED**. |
| 3 | **P06-03 — deduplication / idempotency** (`docs/p06/P06_03_EVIDENCE.md`, **33 tests**). Exit criterion *"Repeated ingestion stable"* **MET**. `DEDUPLICATION_RULES` DD-1…DD-6 declared as data; the existing accepted P05-04 `CanonicalRecordStore` is **reused, not duplicated**. |
| 4 | **The canonical pipeline gate's own intent** — provider payloads are normalized into governed canonical form, and the canonical record is the only thing engines may consume. |
| 5 | **The ADR-01 §G evidence package** at §4.5 below, including the **D12 census reconciliation** as the authority disposition of §G item 1. |

### 3.2 Gate intent preserved in both halves

P06 owns the **conversion**, and only the conversion. It does not own data quality (P07), historical
or PIT semantics (P08), fundamentals lineage (P09), or the engine connection itself (P11). The
**engine boundary** is enforced fail-closed: `assertNoEngineDirectPath` fails on a non-`MD:` key, on
a direct raw→engine path, and on any P11 engine-input mapping performed inside P06.

### 3.3 Scope exclusions — explicitly preserved

| # | NOT part of this acceptance |
|---|---|
| 1 | **No fourth P06 work item exists.** The accepted tracker defines exactly three; all three are complete. |
| 2 | **No P07 or P08 work** — no freshness/staleness detection, no PIT storage, no adjusted/unadjusted series, no corporate actions. |
| 3 | **No P11 engine mapping.** Engine-input→`MD:` mapping is **P11 scope** (`05-engine-boundary.json` N-5). Only **6 of 110** bound keys carry an authoritative mapping. |
| 4 | **No provider execution.** Every corpus used is **local synthetic**. |
| 5 | **No existing-IIPS change is accepted by this act.** The D11 guard and M-1 work are evidence *relied on*; they remain **local, unpushed, and their disposition is a separate decision**. |

---

## 4. Acceptance reasoning — bounded

### 4.1 P06-01 — evidence reviewed

Canonical output determinism is evidenced by a committed **golden** block plus
`p06/evidence-p06-01/02-canonical-fixtures.json`; group **G** of `normalization.test.js` asserts
byte-identity against it. **Guard teeth:** break determinism → **D/1 fails**; tamper a golden
fixture → **G/1 fails**; neuter the M-3 leakage scan → **E/2 fails**.

### 4.2 P06-02 — boundary reviewed

Admission is attestation-gated and **content-based**. **Guard teeth:** adding a tracked
`p06/evidence-p06-03/` artifact at that time → 1 P05 guard failed, proving the boundary test bites.

### 4.3 P06-03 — replay reviewed

Repeat ingestion is stable by rule, not by accident. **Guard teeth:** adding
`docs/p06/P06_04_EVIDENCE.md` → 2 P05 guards failed; adding `P06_GATE_ACCEPTANCE.md` → **2 P05
guards failed** (the tripwire this act now supersedes, §9); smuggling a second raw path → guards failed.

### 4.4 Open items and dependencies — bounded

`P05` is the sole Hard upstream dependency of P06 and is **ACCEPTED**. **OI-10** (exact namespace
token) is the only open item that ever named P06 and is **RESOLVED** (`PROGRAM_STATE.md` §6d, token
`MD:`). **No concessions register exists and none was required** — P05 precedent
(`docs/p05/P05_GATE_ACCEPTANCE.md`:297).

### 4.5 ⚠ ADR-01 §G evidence — the four required items

| §G item | Required | Status |
|---|---|---|
| **1** | Collision census verified | ✅ **SATISFIED via D12** — see §4.6 |
| **2** | 13-engine oracle byte-identity | ✅ **SATISFIED** — 13/13 engines, 97/97 golden cases, 97/97 value-match, 97/97 independently byte-identical |
| **3** | C1–C6 fail-closed guard | ✅ **SATISFIED** — 11/11 guard tests, mutation-verified; ⚠ named digest triples **NOT REPRODUCED** (§5, L-4) |
| **4** | No collateral regression | ✅ **SATISFIED** — `tsc --noEmit` clean; existing-IIPS suite 484/432/52 → 495/455/40, **12 FIXED, 0 BROKEN** |

### 4.6 ⚠ D12 — the authority disposition for ADR-01 §G item 1

§G item 1 was the **single blocking item** identified by the P06 acceptance pre-flight. It could not
be satisfied by measurement alone, because a **derived analysis never supersedes a primary record
without an authority act**. It is closed by **D12** (`docs/p00/P00_DECISION_LOG.md` §10, commit
`3f79e612e06afcd87f09c199665b12354b233e42`), an append-only act by the ADR-01 §H named authority
**Ramki / Sai**:

| Figure | Value | Class | Disposition |
|---|---|---|---|
| Historical documented **coded** | **52** | **PRIMARY** (D4 Part I → `ADR-01 §B.2:57`) | **PRESERVED, unedited** |
| Current measured **coded** | **60** | **DERIVED ANALYSIS** @ `5decdca` | **ADOPTED as controlling** for present acceptance evidence |
| Historical documented **free-form** | **54** | **PRIMARY** (`§B.2:58`) | **UNREPRODUCED — derivation not established; no substitute adopted** |
| Drift | **+8** | DERIVED | healthcare **5→12** (`HC-001…HC-012`), capital-markets **7→8** (`CM-007`), other 5 engines exact |

`collision_census_status` = **`RECONCILED — 60 coded controlling`**.
⚠ **`ADR-01 §B.2` was NOT rewritten** — any text correction remains a separate authorized amendment.

---

## 5. ⚠ Explicit limitations and unresolved matters

| # | Limitation | Status |
|---|---|---|
| **L-1** | **Not exercised against a live provider.** Every corpus is local synthetic. | Standing non-authorization (**N-1**), **not a defect** |
| **L-2** | **P06-02 attestation is a re-derivable provenance binding, NOT a cryptographic authenticity guarantee.** Cross-provider distinctness is **structural**, inherited from frozen **AD-6**. | Recorded and open |
| **L-3** | **The P06-02 attestation gate is content-based** (provenance-through-the-boundary), **not** adversarial authenticity. | Recorded and open |
| **L-4** | ⚠ **The named historical digest triples are NOT REPRODUCED.** `ADR-01 §G item 2` names `44ba…/ea22…/c8ed…`, `5813…` and `3cfb…/92be…`. **0 of 15 candidate artifacts match.** They digest **engine output** under an **undocumented canonicalization**. | **NOT REPRODUCED — recorded and open. No canonicalization was invented to force a match.** |
| **L-5** | ⚠ **AD-17 remains `UNRESOLVED`.** `ReplayService.ts`:20-21 still carries the `byteIdentical: true` literal. The guard module references `ReplayService` **0 times**; the P06 byte-identity evidence was produced by an **independent** sha256-over-canonical-key-sorted-JSON computation and **`ReplayService` was never consulted**. | **UNRESOLVED — not resolved by inference** |
| **L-6** | **40 pre-existing existing-IIPS suite failures** remain (9 out-of-scope files; 6 carry the same 10-engine defect). | **Neither repaired nor excused** — outside the P06 acceptance criteria |
| **L-7** | **P05's PIT repeatability gap is inherited and NOT discharged** by this acceptance. | Remains **MISSING / NOT DEMONSTRATED** |
| **L-8** | **ADR-01 §I remains a stale record** (`PENDING RAMKI/SAI ADR` at :4/:16/:200/:207). | Deliberately **unmodified**; D8:35/:69 is the accepted reconciling artifact |

---

## 6. Non-authorizations — explicitly preserved

| # | Remains |
|---|---|
| **NA-1** | **Provider execution** — **`NOT_AUTHORIZED`** (N-1). No provider selected, onboarded, connected or called. No credentials exist. |
| **NA-2** | **Licensed / deeper historical data acquisition** — **`NOT_AUTHORIZED`** (N-2). |
| **NA-3** | **Production activation** — **`NOT_AUTHORIZED`**. A4 activation control sits at **P16** only. |
| **NA-4** | **Any certification** — **`NONE_GRANTED`**. ⚠ **P06 acceptance is not certification, and grants none.** P06's own gate row records *"Cert before progression = **No**"*, which is why acceptance requirement 5 does not apply. |
| **NA-5** | **Track B → `origin/main` merge** — **`NOT AUTHORIZED`**. |
| **NA-6** | **P07, P08 and every P09–P17 entry or promotion** — **`NOT_AUTHORIZED`**. |
| **NA-7** | **P07–P17 A3 acceptor assignment** — **NOT designated**. Only the P05- and P06-scoped designations exist. |
| **NA-8** | **Any engine, scoring, methodology, calibration or taxonomy change** — none made, none authorized. |
| **NA-9** | **Any repair of M-1, M-5, M-6 or AD-17** — all remain as recorded. |

---

## 7. Final acceptance statement

# **P06 — Canonical pipeline gate — is ACCEPTED.**

**By explicit A3 authority act.** A3 acceptor: **Ramakrishnan V. S. (Ramki)**. Authority decision
selected: **ACCEPT P06**. Boundary applied: `docs/p00/P00_GATE_MODEL.md`:42 minimum evidence plus
the **ADR-01 §G** package, with **D12** as the authority disposition of §G item 1.

⚠ **What this statement does NOT say, and is not to be read as saying:**

| # | It does **not** state that |
|---|---|
| 1 | **a provider was used** — every corpus is local synthetic; provider execution is **`NOT_AUTHORIZED`** (**NA-1**) |
| 2 | **certification is granted** — **`NONE_GRANTED`**; P06 acceptance grants none (**NA-4**) |
| 3 | **production is activated** — **`NOT_AUTHORIZED`**, A4 at P16 only (**NA-3**) |
| 4 | **AD-17 is resolved** — it is **`UNRESOLVED`** and was not resolved by inference (**L-5**) |
| 5 | **the historical digest triples were reproduced** — they were **NOT REPRODUCED** and no canonicalization was invented (**L-4**) |
| 6 | **the historical 54 free-form figure was erased or replaced** — it is **UNREPRODUCED**, preserved, with no substitute adopted (§4.6) |
| 7 | **`ADR-01 §B.2` was corrected** — it is **UNMODIFIED**; any amendment is a separate authorized act (§4.6) |
| 8 | **any engine, scoring, methodology, calibration or taxonomy changed** — none did (**NA-8**) |
| 9 | **the 40 pre-existing existing-IIPS failures were repaired or excused** — they were neither (**L-6**) |
| 10 | **any concession was made** — no concession mechanism was invoked, no concessions register was created, no concessions authority was invented |
| 11 | **any other gate is accepted** — **P07–P17 remain NOT ACCEPTED / NOT AUTHORIZED** |
| 12 | **any individual holds A1, A2 or A4** — only the **P05- and P06-scoped A3** designations exist |

---

## 8. Resulting program state

| Field | Value |
|---|---|
| `formal_gate_status` | **7 of 18 accepted — P00, P01, P02, P03, P04, P05, P06** · P07–P17 **NOT ACCEPTED** |
| **P06** | **✅ ACCEPTED** — by explicit A3 act; P06-01 + P06-02 + P06-03, all three complete |
| `p06_acceptance_status` | **`ACCEPTED`** *(prior state `NOT_ACCEPTED`)* |
| `p06_entry_authorization_status` | **`AUTHORIZED`** *(unchanged — D10-2)* |
| `p06_work_items_complete` | **ALL THREE** *(unchanged)* |
| `collision_census_status` | **`RECONCILED — 60 coded controlling`** *(D12)* |
| `adr_01_section_g_item_1` | **`SATISFIED`** *(D12)* |
| `ad_17_status` | **`UNRESOLVED`** *(unchanged)* |
| `certification_status` | **`NONE_GRANTED`** *(unchanged)* |
| `production_activation_status` | **`NOT_AUTHORIZED`** *(unchanged — A4 at P16 only)* |
| **Provider / licensed execution** | **`NOT_AUTHORIZED`** *(unchanged — N-1 / N-2)* |
| **Track B → `origin/main`** | **`NOT AUTHORIZED`** *(unchanged)* |
| **P07 / P08** | **`NOT_AUTHORIZED`** *(unchanged)* |
| **PIT repeatability** | **`MISSING / NOT DEMONSTRATED`** — inherited from P05, **not discharged by this acceptance** |
| Existing-IIPS | **UNCHANGED by this act** — `64797d6` / `4292fff` remain local, unpushed, no branch created |
| Implementation performed by this act | **NONE** |
| Provider work performed by this act | **NONE** |

---

## 9. Recording integrity

| Field | Value |
|---|---|
| **Files edited by this act** | **5** — this record (new) · `docs/PROGRAM_STATE.md` (current-state, additive) · `docs/p00/P00_GATE_MODEL.md` (current-state ledger lines only) · `p05/tests/existing-iips-boundary.test.js` and `p05/tests/no-provider-dependency.test.js` (**one superseded governance guard each — disclosed below**). This mirrors **exactly** the 5-file shape of the accepted P05 act (`19713d8b`). |
| **Historical records rewritten** | **NONE.** `P00…P05_GATE_ACCEPTANCE.md` (all six byte-identical, P05 blob `94f87c614795fc47692d924a8490bc8d41e98d5a`) · `P00_AUTHORITY_REGISTER.md` · `P00_DECISION_LOG.md` §1–§10 · `P00_OPEN_ITEMS_REGISTER.md` · `P00_EVIDENCE_CONVENTIONS.md` · CHECKPOINT-01/02/03 · D4 · D8 · D9 · D11 · D12 · ADR-01 · ADR-02 · INCIDENT-01/02 and the three `P06_0X_EVIDENCE.md` records |
| **`ADR-01 §B.2`** | ⚠ **UNMODIFIED** — still reads 52 / 54. **D12 is the controlling disposition**; no ADR-01 text was corrected by this act. |
| **`ADR-01 §I`** | **UNMODIFIED** — still `PENDING`; D8:35/:69 is the accepted reconciling artifact. |
| **`P00_DECISION_LOG.md`** | **NOT appended.** `P00_DECISION_LOG.md` §5 rule 4 — *"Authority approval is never recorded as certification or gate acceptance"* — and both the P04 and P05 precedents (`faf1317`, `19713d8b` added no decision-log entry). Gate acceptance is deliberately recorded **here**, not in the authority-approval log. |
| **`P00_GATE_MODEL.md` edit scope** | ⚠ **Disclosed:** the *"Current formal gate status"* ledger line, the P06 row's status column, and the closing explicit-statement paragraph — **current-state ledger only**, mirroring what `19713d8b` did for P05. **No acceptance requirement, no gate intent, no minimum-evidence text and no authority decision was altered.** `:42` (P06 gate intent + minimum evidence) and `:58-65` (the six acceptance requirements) are **unchanged**. |
| **`PROGRAM_STATE.md` edit scope** | **Additive.** A new current-state header block, the §3 status-table fields, a new §6l block, a new §8 row **`8m`**, and the §14 status-invariant line. Rows 8 and 8a–8l are **left unedited** as the record of their own moment. |
| **`p06/src`, `p06/tests`, `p06/fixtures`, `p06/evidence*`** | **UNMODIFIED** — no implementation, fixture or evidence file was touched by this act. `p06/evidence-p06-01/00-INDEX.json` still reads `p06Acceptance: "NOT_ACCEPTED — no P06_GATE_ACCEPTANCE.md exists (D10-6)"` — **that historical value is not retro-edited**, and the guard now *requires* it to stay that way. |
| ⚠ **`p05/tests` — 2 files changed, disclosed in full** | **One superseded governance guard in each of `existing-iips-boundary.test.js` and `no-provider-dependency.test.js`.** Both formerly asserted *"no `P06_GATE_ACCEPTANCE.md` may exist anywhere"* — a tripwire that was correct, and load-bearing, **while P06 was unaccepted**, because it made a silent or unauthorized acceptance impossible to commit. D10-6 records *"P06 AUTHORIZATION IS NOT P06 ACCEPTANCE"*, and `PROGRAM_STATE.md`:584 predicted precisely this: *"add `P06_GATE_ACCEPTANCE.md` → **2 P05 guards fail**"*. The A3 acceptance act is precisely the event the guard protected against happening **silently**. ⚠ **The guards are REPLACED, NOT WEAKENED, and the protective surface is enlarged, not reduced.** Every condition they protected is still asserted, and the new guards additionally require that **this record itself** carry each limitation the old tests protected by absence: that `D10` still reads *"P06 AUTHORIZATION IS NOT P06 ACCEPTANCE"* and *"No `P06_GATE_ACCEPTANCE.md` is created by this entry"* (proving acceptance was **added by a separate act and never retro-edited into D10**) · `p06/evidence-p06-01/00-INDEX.json` still `NOT_ACCEPTED` · **P07/P08 still barred** · **no P06-04** · **`ADR-01 §B.2` unmodified** · **AD-17 `UNRESOLVED`** · **digest triples `NOT REPRODUCED`** · certification `NONE_GRANTED` · activation `NOT_AUTHORIZED` · provider execution `NOT_AUTHORIZED` · **no concessions register anywhere in `docs/`** · and **that this record contains none of the prohibited concession vocabulary** — a constraint the guard checks mechanically against this file's own bytes, and which this sentence is deliberately worded to respect rather than to trip. **No assertion was deleted and no other test file was touched.** |
| **Concessions register** | **NOT CREATED** — none exists, none was required, and no concessions authority was invented |
| **Tracker XLSX / SPEC DOCX** | **UNMODIFIED** |

---

**P06 — Canonical pipeline gate — is ACCEPTED. 7 of 18 gates accepted.**
**AD-17 remains `UNRESOLVED`. The named historical digest triples remain `NOT REPRODUCED`.**
**The historical 54 free-form census figure remains `UNREPRODUCED` — preserved, not erased.**
**Provider execution and licensed acquisition remain `NOT_AUTHORIZED`.**
**Certification `NONE_GRANTED`. Production activation `NOT_AUTHORIZED`.**
**P07–P17 remain NOT ACCEPTED / NOT AUTHORIZED. Next authorized action: none without a separate act.**
