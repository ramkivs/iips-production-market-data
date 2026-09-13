# P06-01 — EVIDENCE RECORD (normalization pipeline)

> **Authority: D10-2** — `docs/p00/P00_DECISION_LOG.md` §8.1, commit
> `b41240c406914f34f06c2f7bc3986bdeb436018d`: ***"P06 ENTRY is AUTHORIZED … Scope = `P06-01`,
> `P06-02`, `P06-03` ONLY — normalization pipeline · raw/canonical separation ·
> deduplication/idempotency."***
>
> ⚠ **This record covers `P06-01` only.** P06-02 and P06-03 are authorized for **entry** and are
> **NOT implemented** by this act (§7).
>
> ⚠ **This record is ADDITIVE.** It edits no historical authority record. In particular ADR-01 §I
> (*"Blocks: … P06 Normalization"*) and `P02_PROVIDER_MAPPING_RULES.md` §4 **N-3/N-4/N-6**
> (*"`<NS>` placeholder / `MD:<domain>.<field>` is NOT adopted / BLOCKED (DEP-P02-01)"*) remain
> **historically true and unedited**; both are superseded as to current state **by citation** —
> **OI-10 RESOLVED** (`docs/CHECKPOINT-03.md` §3, releasing **P05, P06, P11** from the OI-10
> blocker) and **D8** (`ADR-01-A2 APPROVED — fail-closed`).

---

## 1. The authoritative scope — taken from the repository, not invented

`Work Tracker`!P06-01 (TRACKER, unmodified):

| Field | Value |
|---|---|
| Work Item | **Normalization pipeline** |
| Requirement | **Convert provider payloads into canonical records.** |
| Deliverable | **Normalization pipeline** |
| Dependencies | `P01,P04,P05` (Hard) — **all ACCEPTED** |
| Entry Criteria | **Input fixtures available** |
| Exit Criteria | **Canonical output deterministic** |
| Test / Validation | **Golden tests** |
| Evidence | **Canonical fixtures** |
| Critical Path | YES |

`Phase Gates`!P06 — **Canonical pipeline gate**, intent: *"Normalize provider-specific payloads into
governed canonical representations **without feeding raw provider data directly to engines**."*

### 1.1 Two artifacts make "mapping execution is P06-01" authoritative rather than inferred

| Source | Statement |
|---|---|
| `docs/p02/P02_PROVIDER_MAPPING_RULES.md` **MR-5** | ***"Mapping execution is P06. P02 defines only the rules the execution must obey."*** |
| `docs/p01/P01_FIELD_DICTIONARY.md` **FD-7** | ***"This dictionary declares contract slots, not provider mappings. Provider-to-canonical mapping is P06."*** |
| `docs/p04/P04_SCOPE_AND_BOUNDARY.md` **X-4** | Normalization pipeline **excluded from P04**, owner **P06** |

So P06-01 is the **declarative provider-to-canonical mapping execution layer**: a mapping declared
as **data** (P02 §5 **MD-1…MD-8**, rules **M-6**, **MR-2**, **MR-4**) executed **deterministically**
(**MR-1**) to produce P01 canonical records. **No requirement was invented, widened or substituted.**

### 1.2 Relationship to P05 (recorded, not glossed)

P05's adapters already emit namespaced canonical snapshots, but their mapping is **embedded in
imperative code** (`localFeed.js` `mapQuote`/`mapClose`/`mapValuation`). P02 **M-6** and **MR-4**
require the mapping to be **declared and reviewable as data**, and **MR-5** places *execution* in
P06. **P06-01 supplies that declared-mapping execution layer.** This does **not** invalidate P05,
which was accepted on its own criteria and is unchanged.

---

## 2. Implementation

| Component | File | Role |
|---|---|---|
| **Declaration** | `p06/src/mappingDeclaration.js` | validates + freezes **MD-1…MD-8**; closed transformation vocabulary; refuses undeclared transforms, duplicate slots, invented domain segments, fabricated-on-absent, namespaced provider names, and any non-`LOCAL_FIXTURE` kind |
| **Execution** | `p06/src/normalizationPipeline.js` | executes a declared mapping → P01 canonical record (**MR-5**, **MR-1**); plus the engine-boundary guard |
| **Identity** | `p06/src/identityResolution.js` | **pure pass-through** onto `p05/src/identity.js` — implements nothing |
| Fixtures | `p06/fixtures/normalization-fixtures.json` | provider-native payloads, **3 declared mappings**, 5 cases, 6 negative cases, and the committed **golden** block |

### 2.1 Reuse, not duplication (no namespace or collision logic re-implemented)

| Concern | Source of truth | Reused by |
|---|---|---|
| `MD:` token, domain-segment vocabulary | `p05/src/namespace.js` `NAMESPACE_TOKEN`, `ALL_DOMAIN_SEGMENTS`, `buildKey` | imported |
| **ADR-01 C1–C6** | `p05/src/namespace.js` `assertC1`–`assertC4`, `assertCollisionGuard` | imported |
| Canonical field / snapshot construction (**C1, FD-1, NL-1…NL-7, SM-1…SM-6, CU-2, UN-1, ST-1…ST-12, FD-5, RF-6/RF-7**) | `p05/src/contract.js` `buildField`, `buildSnapshot`, `computeCompletenessPct` | imported |
| Snapshot validation (**S1–S4**, quality classification) | `p05/src/validate.js` `validateSnapshot` | imported |
| Canonical serialization / decimal / ISO-UTC | `p05/src/serialize.js` | imported |
| Identity, FIGI authority, cardinality | `p05/src/identity.js` `MappingRegister`, `buildIdentityRef` | imported |

**Asserted by test C/1:** no P06-01 module may `export function assertC[1-6]` or re-declare
`NamespaceViolation`, and the pipeline must import the guard from `../../p05/src/namespace.js`.

### 2.2 Determinism

No wall clock, no randomness, no ambient input (**D-3**, asserted by test D/5). `receivedAt` and
`asOf` are **supplied**; `asOf` comes from the **declared** envelope source. `dataVersion` is derived
from the canonical content digest (**DV-1/DV-2**), never from a clock.

---

## 3. Exit-criteria results — exact

| Tracker criterion | Result | Evidence |
|---|---|---|
| **Entry** — *Input fixtures available* | ✅ **MET** | `p06/fixtures/normalization-fixtures.json` — reuses the accepted **P05-01** local provider vocabulary and the accepted **P04** identity fixtures; no new provider |
| **Exit** — ***Canonical output deterministic*** | ✅ **MET** | **D-1** byte-identical canonical serialization across **5 repeats per case** (all 5 cases: `distinctSerializations == 1`) · **D-2** independent instances agree byte-for-byte · **D-3** the declared configuration genuinely participates (changing declared precision changes the output) · **D-4** no wall clock / randomness / ambient input |
| **Test / Validation** — *Golden tests* | ✅ **MET** | `p06/tests/normalization.test.js`, **55 tests**, group **G** asserts byte-identity against the committed golden fixtures |
| **Evidence** — *Canonical fixtures* | ✅ **MET** | the `golden` block of the fixtures file, mirrored at `p06/evidence-p06-01/02-canonical-fixtures.json` |

### 3.1 The five golden canonical fixtures

| Case | Mapping | Mode | `snapshotId` | Keys | Quality | Completeness |
|---|---|---|---|---|---|---|
| **N-01** | D01 quote | LIVE | `data-localfix-vf4736b8bbde259a7-2026-03-02T14:30:00.000Z` | 6 | `good` | 100 % |
| **N-02** | D01 quote | LIVE | `data-localfix-vcb49824bcbd02f3b-2026-03-02T14:30:00.000Z` | 6 | `partial` | 33.33 % |
| **N-03** | D01 close | SNAPSHOT | `data-localfix-v710f387954c5cf66-2026-03-02T00:00:00.000Z` | 6 | `good` | 100 % |
| **N-04** | D01 close | SNAPSHOT | `data-localfix-v545ce3716c599cd2-2026-03-03T00:00:00.000Z` | 6 | `partial` | 66.67 % |
| **N-05** | D01 valuation | SNAPSHOT | `data-localfix-v2c3e0e2653f64f71-2026-03-02T00:00:00.000Z` | 3 | `good` | 100 % |

N-02 and N-04 exercise **M-5**: source silence becomes **`NOT_PROVIDED`** with `value: null`
(**NL-3** — no substituted value), never a fabricated zero, and quality drops to `partial`.

---

## 4. Test result — **319 / 319 PASS**

```
cd p05 && node --test "tests/**/*.test.js"     # 264 tests, 264 pass, 0 fail
cd p06 && node --test "tests/**/*.test.js"     #  55 tests,  55 pass, 0 fail
```

| Suite | Tests |
|---|---|
| `p05/` (unchanged behaviour) | **264** |
| `p06/tests/normalization.test.js` **(NEW)** | **55** |
| **TOTAL** | **319** |

**0 pre-existing tests removed · the P05 suite count is UNCHANGED at 264 · net assertion counts
did not decrease.** Two pre-existing P05 guard files were edited —
`existing-iips-boundary.test.js` (**24 → 36** assertions, 11 tests → 11 tests) and
`no-provider-dependency.test.js` (**119 → 119** assertions, 15 tests → 15 tests) — and **every other
pre-existing P05 test file has an assertion delta of exactly +0**.

⚠ **Precisely: 4 assertion *statements* were textually REPLACED** (not silently dropped). Each
replacement is equal-or-stronger, and the replacement is stated here so the change is auditable:

| # | Replaced assertion | Replacement | Net effect |
|---|---|---|---|
| 1 | `assert.deepEqual(executables, [], 'P05-01 introduces the only executable source…')` where `executables` excluded only `p05/` | same assertion over an **enumerated, self-asserted** allow-list `['p05/','p06/']` | equal on intent, **+1** assertion pinning the enumeration |
| 2 | `assert.deepEqual(sources.filter((f) => !f.startsWith('p05/')), [])` | same assertion over the enumerated allow-list | equal |
| 3 | `assert.ok(!readdirSync(docsRoot).includes('p06'), …)` | if `docs/p06` exists, **every** artifact must match `^P06_01_` | **stronger** |
| 4 | `assert.deepEqual(acceptanceArtifacts, [])` scanning only `docs/p05` and `docs/p00` | a **recursive scan of all of `docs/`** | **stronger** |

The existing-IIPS filename check in assertion 1's own test — the protection the test exists to
provide — is **byte-for-byte unchanged**.

`p06` groups: **A** declaration conformance (10) · **D** determinism / exit criterion (5) ·
**G** golden tests (2) · **K** canonical key formation (5) · **I** identity (5) · **C** collision by
reuse (6) · **F** fail-closed (9) · **E** engine boundary (5) · **B** boundary (8).

---

## 5. ⚠ Evidence classification — the four kinds, kept strictly apart

| Kind | Produced here? | Where |
|---|---|---|
| **Implementation** | ✅ **YES** | `p06/src/*`, 319 passing tests |
| **Local / synthetic test** | ✅ **YES** — this is what the canonical fixtures are | `p06/fixtures/normalization-fixtures.json`, `p06/evidence-p06-01/` |
| **Contract / lifecycle** | ⚠ **NO — unchanged** | P05-02 / P05-03 remain specification + adapter-contract only. **This act adds nothing to them** |
| **Provider execution** | ❌ **ABSENT — AND MUST REMAIN ABSENT** | No provider selected, named, contacted or bound. No credential or entitlement provisioned. No network call made. Live provider execution remains **`NOT_AUTHORIZED`** (D9 **N-1**, D10 §8.2) |

⚠ **The canonical fixtures are LOCAL SYNTHETIC fixtures.** `localfix` is a synthetic local source;
`provider-register.json` is **unmodified** with exactly **1** `LOCAL_FIXTURE` identity. Every
artifact carries `classification.isProviderEvidence: false` and `phaseScope: "P06-01"`, asserted by
test **G/2**.

---

## 6. The engine boundary — enforced in code, not in prose

`Phase Gates`!P06 forbids *"feeding raw provider data directly to engines."*
`assertNoEngineDirectPath` fails closed on:

| # | Condition | Rule |
|---|---|---|
| 1 | any field key not carrying `MD:` | **C1 / FD-1 / N-2** |
| 2 | a bare existing engine input key (`peRatio`, `evEbitda`, `evRevenue`, `fcfYield`) appearing anywhere in the record | **N-5 / FD-3** — engine-input mapping is an explicit declared transformation owned by **P11** |
| 3 | a provider-native name appearing anywhere in the record, **including inside a lineage or provenance string** | **M-3 / LA-18** |
| 4 | a free-form `extras` / `rawPayload` / `nativePayload` / `metadata` / `additionalProperties` member | **M-4** |

The leakage scan strips canonical keys first and matches on **word boundaries**, so a legitimate
structural name (`venueRef`) is not mistaken for the provider element `venue`, while a name
smuggled into `'chain-with-sym-inside'` **is** caught. Tests **E/2–E/4** prove the guard detects
each of those, not merely passes.

⚠ **One implementation defect was found by this guard and fixed:** the provenance reference
originally embedded the provider field name (`lineage:<sourceRef>:<providerElement>`), which is an
**M-3** violation. It now points at the **source record** (`context.sourceRecordRef`); the provider
element is recorded only in the **declared mapping** (**MD-2**), where provider-native names belong.

---

## 7. ⚠ P06-02 and P06-03 are NOT implemented — how the boundary is enforced

| Work item | Requirement | Deliverable | Status |
|---|---|---|---|
| **P06-01** | Convert provider payloads into canonical records | Normalization pipeline | ✅ **implemented** |
| **P06-02** | Keep raw provider payloads separate from governed canonical data | **Storage boundary** | ❌ **NOT implemented** |
| **P06-03** | Prevent duplicate records across retries/replays/providers | **Deduplication rules** | ❌ **NOT implemented** |

**P06-02 boundary:** the provider payload is an **argument** and the canonical record is a
**return value**. No file is written, no raw store exists, and no raw-bypass detection surface is
built. Test **B/3** asserts no P06-01 module contains `writeFileSync` / `mkdirSync` /
`createWriteStream`, any `*RawStore` / `*StorageBoundary` class, or `bypass(Validation|Detection)`.

**P06-03 boundary:** no deduplication rule, duplicate key, cross-provider merge or idempotency key
exists. Test **B/4** asserts this against **code** (comments stripped).

⚠ **Determinism is NOT deduplication.** P06-01's exit criterion is a **purity** property
(same input ⇒ byte-identical output). It is deliberately **not** presented as P06-03's
*"Repeated ingestion stable"*, and the distinction is stated in the module header and asserted in
B/4.

---

## 8. ⚠ Recorded limitations — first-class content, not omissions

| # | Limitation | Cause |
|---|---|---|
| **L-1** | **Normalization has NOT been exercised against a live provider.** It is demonstrated over **synthetic local** provider payloads (the P05-01 local fixture vocabulary). | A **standing non-authorization** (D9 N-1, D10 §8.2) — **not** a P06-01 defect. Recorded, not papered over. No synthetic evidence is presented as provider evidence |
| **L-2** | **Three** declared mappings are provided (D01 quote · D01 close · D01 valuation). Dictionary domains **D02–D10 are NOT declared** here. | Scope discipline — only what is implemented is claimed. Declaring them is further P06-01 work and is **not** claimed as done |
| **L-3** | Historical records are **not** edited. ADR-01 §I still reads *"Blocks: … P06 Normalization"*; P02 §4 N-3/N-4/N-6 still read *"`<NS>` placeholder / `MD:` NOT adopted / BLOCKED (DEP-P02-01)"*. | Append-only governance rule (`P00_DECISION_LOG.md` §5 rule 1). Both are superseded as to current state by **OI-10 RESOLVED** (`CHECKPOINT-03` §3) and **D8** — **cited, never edited** |
| **L-4** | **P06-01 completion is NOT P06 gate acceptance, NOT certification, NOT provider authorization and NOT production activation.** | **D10-6** — *"P06 AUTHORIZATION IS NOT P06 ACCEPTANCE."* |

---

## 9. ⚠ Disclosure — one existing governance guard was superseded, not weakened

`p05/tests/existing-iips-boundary.test.js` contained
**`'P06 / P07 / P08 remain untouched — no artifacts, no implementation'`**, which asserted that
`docs/p06` must **not** exist and that **no** tracked file matches `P06[_-]`. That was **correct and
load-bearing** while P06 was `NOT_AUTHORIZED`: it made an unauthorized P06 build-out impossible to
commit silently.

**D10-2 is precisely the act that guard was waiting for**, so it is replaced — on the terms
`P05_GATE_ACCEPTANCE.md` §9 and `P05_04_EVIDENCE.md` §7 set for the analogous tripwires:
***the protective surface is enlarged, not reduced.***

| Condition the old guard protected | Status now |
|---|---|
| **`docs/p07` / `docs/p08` must not exist** | ✅ **UNCHANGED** — still asserted |
| **No tracked P07 / P08 artifact** | ✅ **UNCHANGED** — still asserted |
| **`docs/p06` must not exist** | ⚠ **RESCOPED**, because D10-2 authorizes exactly that. Replaced by: `docs/p06` may exist but may contain **only P06-01 artifacts** — **no `P06_02_*` / `P06_03_*` artifact** and **no `P06_GATE_ACCEPTANCE.md`** |
| **No tracked `P06[_-]` artifact** | ⚠ **RESCOPED** to: no `P06_GATE_ACCEPTANCE.md`, no P06-02/P06-03 artifact |
| **P08 ownership declared, not implemented** | ✅ **UNCHANGED** |

**New assertions added** (surface enlarged): `docs/p06` may hold **only** P06-01 artifacts ·
**no P06 acceptance artifact may exist anywhere** · **no `p06/` code may implement P06-02 storage or
P06-03 deduplication** · the P06-01 evidence index must classify itself as non-provider,
non-P06-02, non-P06-03 evidence.

**No assertion was deleted** and no other test file's assertions were altered.

---

## 10. Gate position — UNCHANGED

| Field | Status |
|---|---|
| `formal_gate_status` | **6 of 18 accepted — P00, P01, P02, P03, P04, P05** *(unchanged — this act accepts no gate)* |
| `p06_01_status` | **`IMPLEMENTED + EVIDENCED`** *(was `NOT STARTED`)* — limitations **L-1…L-4** recorded |
| `p06_02_status` | **`AUTHORIZED` for entry, NOT implemented** |
| `p06_03_status` | **`AUTHORIZED` for entry, NOT implemented** |
| `p06_acceptance_status` | **`NOT_ACCEPTED`** — **no `P06_GATE_ACCEPTANCE.md` exists**, and none is created (**D10-6**) |
| `p06_a3_gate_acceptor` | **Ramakrishnan V. S. (Ramki)** (**D10-3**), scoped to **P06**. ⚠ **Designation ≠ acceptance** |
| `p05_02_live_provider_execution` | **`NOT_AUTHORIZED`** (D9 N-1) |
| `licensed_historical_acquisition` | **`NOT_AUTHORIZED`** (D9 N-2) |
| `production_activation_status` | **`NOT_AUTHORIZED`** (A4 at P16 only) |
| `certification_status` | **`NONE_GRANTED`** — authority authorization is never certification |
| `track_b_to_main_merge` | **`NOT AUTHORIZED`** |

### 10.1 What this act did NOT do

No **P06-02** raw/canonical storage boundary · no **P06-03** deduplication rules · no P06 acceptance
artifact · no certification · no production activation · no provider selection / entitlement /
credential / provider configuration · no licensed historical acquisition · **no Track B →
`origin/main` merge** · no edit to any historical P00–P05 authority record · no variation of
**ADR-01 C1–C6** · no change to the **`MD:`** token · **no P11 engine-input mapping** · no
existing-IIPS modification (`ReplayService`, `DataBoundExecutor`, `LiveDataRuntime.ts`,
methodology, scoring, calibration, taxonomy, `NormalizedHolding` / `companyId`, CSIP) ·
**no concessions register**.

### 10.2 Open items — unchanged

`OI-P04-03` · `OI-P04-04` · `DEP-P01-04` · `OI-D9-01` · `M-1 / AD-4` · `M-5` (blocks C12
certification) · `M-6` · `AD-17 / M-2` · **PIT-1…PIT-7 MISSING / NOT DEMONSTRATED** (travels to P08
undischarged) · `DO-P04-1…5` / `DO-1…DO-5`. `DEP-P02-01` is superseded as to current state by
OI-10 resolution; its P02 text is left unedited.

---

## 11. P06-01 completion — precise meaning

**P06-01 is COMPLETE within the D10-2 authorized boundary**: its authoritative exit criterion
(*"Canonical output deterministic"*) is demonstrated, its *Test / Validation* artifact exists
(*golden tests*, 55), and its *Evidence* artifact exists (*canonical fixtures*).

⚠ **That statement is bounded and must be read with L-1 and L-2.** It means the pipeline is built
and proven deterministic over the governed local surface with three declared mappings. It does
**not** mean normalization has been exercised against a provider, and it does **not** mean the
remaining dictionary domains are declared.

⚠ **P06-01 completion is NOT P06 acceptance, NOT certification, NOT provider authorization and NOT
production activation** (L-4 / D10-6).

### 11.1 Exact next governance-safe step

**P06-02 — raw/canonical separation** is the next step. It is already entry-authorized by D10-2, and
both of its Hard dependencies are now satisfied: `P05-04` (implemented + evidenced) and `P06-01`
(this act). Its exit criterion is *"Raw data never bypasses validation."*

⚠ **P06-02 and P06-03 remain separately governed work items** even though their entry authorization
already exists. Each requires its own implementation, evidence and (for P06 overall) a separate
explicit acceptance act by the designated A3 acceptor (**Ramki**, D10-3) carrying the
`P00_GATE_MODEL.md`:42 minimum evidence — *"Token recorded; C1–C6 collision guard evidence;
13-engine oracle byte-identity"* — plus ADR-01 §G evidence.

## 12. Evidence package — `p06/evidence-p06-01/` (9 files)

| File | Content |
|---|---|
| `00-INDEX.json` | index, authority, tracker row, exit-criteria assessment, gate status |
| `01-declared-mappings.json` | the three **declared** mappings: MD-1…MD-8, slots, digests, JSON round-trip stability |
| `02-canonical-fixtures.json` | **the tracker's Evidence artifact** — the governed canonical records |
| `03-exit-criterion-determinism.json` | **D-1…D-4**, each with measured values and a boolean result |
| `04-containment-namespace-identity.json` | M-1…M-6 containment, `MD:` namespace, identity/FIGI authority |
| `05-engine-boundary.json` | the engine-boundary attestations and rules N-5 / FD-3 / M-3 / M-4 |
| `06-negative-fail-closed.json` | every declaration and execution rejection, with its rule |
| `07-scope-boundary.json` | P06-02 / P06-03 **NOT** implemented, and how each is bounded |
| `08-limitations-and-open-items.json` | L-1…L-4, unchanged open items, what this act did not do |

**Determinism:** regenerating produces **byte-identical** output — verified for both the evidence
package and the fixtures file (`diff -r -q`: identical). `00-INDEX.json` records a `sha256` per file.

Reproduce: `cd p06 && npm run evidence:p06-01`.
