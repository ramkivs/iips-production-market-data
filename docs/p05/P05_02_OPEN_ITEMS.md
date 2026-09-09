# P05-02 — OPEN ITEMS, BOUNDED DEPENDENCIES AND EXPLICIT NON-RESOLUTIONS

**Companion to:** `docs/p05/P05_02_SPECIFICATION.md` · `docs/p05/P05_02_EVIDENCE.md`
**Authorization:** `docs/d9/D9_P05_ENTRY_AUTHORIZATION.md` §3 **A-2** — commit `31c2655`
**Nature:** **Recording only.** Nothing in this file resolves, closes, narrows or reinterprets an
existing open item. Recording an open item is **not** resolving it (**IB-2**).

---

## 1. Open items — unchanged by this execution

| Item | Status before | Status after | Note |
|---|---|---|---|
| **OI-P04-04** — FIGI source availability, licensing, coverage | **OPEN** | **OPEN** | Untouched. Synthetic FIGI values (`BBG00SYNTH##`) carry **no** sourcing, licensing or coverage claim |
| **OI-P04-03** — tenant/region governance attribute set | **OPEN** | **OPEN** | Untouched. **No attribute invented.** Bounded by **IB-1…IB-5** |
| **OI-08** — identity cardinality | RESOLVED **1:N** | RESOLVED **1:N** | Not reopened |
| **OI-09** — external identifier standard | RESOLVED **FIGI / OpenFIGI** | RESOLVED **FIGI / OpenFIGI** | Not reopened |
| **OI-10** — namespace token | RESOLVED `MD:` / `MD:<domain>.<field>` | RESOLVED, unchanged | Used exactly as recorded; no rewriting of accepted `<NS>` records (**N-7**) |
| **OI-D9-01** — domain-segment vocabulary | RESOLVED BY EVIDENCE | Unchanged | No label invented (**N-6**) |
| **OI-P04-01, -02, -05** | OPEN | OPEN | Untouched |
| **OI-05 / OI-06 / CD-01** | OPEN | OPEN | Untouched |
| **AD-17** — replay verification firewall | **UNRESOLVED** | **UNRESOLVED** | `ReplayService` untouched. **PB-4** carried: UI17 must not present `reproduced`/`byteIdentical` as verified reproduction |
| **M-1 / AD-4**, **E2E-030** | `OPEN_REVALIDATION_REQUIRED` | Unchanged | Not repaired |
| **M-5** (C12 BLOCKED), **M-6** | OPEN | OPEN | Not repaired |
| **DO-P04-1…5**, **DO-1…DO-5** | **DEFERRED — NOT PASSED** | Unchanged | Not converted |

---

## 2. BD-02 — provider selection / entitlement / credentials / P16 authority

> ### ⚠ Label provenance — recorded honestly
>
> **`BD-02` is the label used in the tasking for this work package. It did not previously exist in
> this repository.** A search of `docs/` and `p05/` found **zero** prior uses of any `BD-0N`
> identifier; the repository's own conventions are **`BD-P05-01-NN`** (bounded dependencies,
> `P05_01_OPEN_ITEMS.md` §3) and **`DEP-Pxx-NN`** (dependency registers).
>
> Rather than invent a register entry or silently rename it, `BD-02` is recorded here **under the
> tasking label**, with an explicit mapping to the identifiers the repository actually uses:
>
> | Tasking label | Repository identifiers | Where recorded |
> |---|---|---|
> | **BD-02** — provider selection / entitlement / credentials / P16 authority | **DEP-P02-07** — *"No provider-selection authority is recorded"* · **DEP-P02-06** — cost dimension `UNKNOWN`, no commercial authority · **P16** — commercial licence negotiation and activation · **INV-10** — entitlement matrix **EMPTY** | `docs/p02/P02_DEPENDENCY_REGISTER.md`; `docs/p02/P02_ENTITLEMENT_MODEL.md` **EM-3**; D9 **N-1** |
> | | Also carried as **BD-P05-01-02** | `docs/p05/P05_01_OPEN_ITEMS.md` §3 |

### 2.1 Status

| Field | Value |
|---|---|
| **Item** | **BD-02** — provider selection, entitlement grant, credentials, connectivity |
| **Status** | **OPEN** |
| **Resolved by this work package?** | ❌ **NO** |
| **Blocks P05-02 specification / adapter-contract work?** | ❌ **NO** — that work is complete |
| **Blocks P05-02 live execution?** | ✅ **YES** — and live execution is **NOT AUTHORIZED** in any case (D9 **N-1**) |
| **Blocks P05 gate acceptance?** | ✅ **YES** — the P05 gate spans P05-01…P05-04 |
| **Blocks downstream only?** | Additionally **P16** (activation) and **P15** (certification) |
| **Authority required** | A provider-selection authority act (**DEP-P02-07**: no A-role is assigned to it) and licensing authority (**P16**) |
| **Current facts** | Provider selection **NONE MADE** · entitlement matrix **EMPTY** · credentials **NONE** (P03 is specification only) · connectivity **none** |

### 2.2 What P05-02 did about it

It defined the **requirement surface** — the shape a credential requirement and an entitlement
outcome must take (**LA-21**, **LA-22**) — and **no values**. `declareCredentialRequirement()` returns
`status: 'REQUIREMENT_ONLY'`, `valuePresent: false`, `endpointPresent: false`, `owner: 'P03'`. The
entitlement matrix remains **EMPTY**, which per **EM-4** means **nothing is entitled** — consistent
with `NOT_AUTHORIZED` production activation.

---

## 3. Bounded dependencies recorded, not resolved

| # | Dependency | Why bounded | Disposition |
|---|---|---|---|
| **BD-P05-02-01** | **BD-02** — provider selection, entitlement, credentials, connectivity (§2) | D9 **N-1**; **DEP-P02-07**; **P16** | **OPEN**. Recorded; **not** resolved |
| **BD-P05-02-02** | "Authenticated ingestion works" (tracker P05-02 **Exit Criteria**) | Requires live execution — **NOT AUTHORIZED** | **UNVERIFIED**. **Not claimed** |
| **BD-P05-02-03** | "Integration tests" + "Provider evidence" (tracker P05-02 **Test/Validation**, **Evidence**) | Requires a provider. The tracker does **not** treat a local contract test as an integration test | **UNVERIFIED**. This package is **CONTRACT VALIDATION ONLY** |
| **BD-P05-02-04** | **OI-P04-04** — FIGI sourcing, licensing, coverage | OPEN at P04; D9 **N-2** | **OPEN**. Synthetic values only; **no** licensing or coverage claim |
| **BD-P05-02-05** | ISO-4217 currency vocabulary is **provider-specific configuration** (**LA-31**) | Full membership validation needs the vocabulary as configuration — layer 3, **not authorized** by D9 A-2 | **OPEN**. Local double is `SHAPE_ONLY`; a shape-valid non-code (`XYZ`) is **not** caught locally, and that is stated, not hidden |
| **BD-P05-02-06** | The P05-01 regex secret scanner does not detect the **serialized-JSON** credential form | A regex over text cannot see structure | **OPEN**. **LA-20** covers it structurally. Repairing the P05-01 scanner is out of P05-02 scope |
| **BD-P05-02-07** | Lifecycle fixture coverage exercises **2 of 5** states | `suspended`, `merged`, `superseded` unexercised by the P05-01 fixtures | **OPEN**, **non-blocking**. Widening fixtures touches no boundary |
| **BD-P05-02-08** | **OI-P04-03** — tenant/region governance attribute set | D9 **N-4**, **N-5**; **IB-1…IB-5** | **OPEN**. **No attribute invented.** Lifting **IB-1** requires an explicit **A1** act |
| **BD-P05-02-09** | **P05-04** orchestration — scheduling, retries, idempotent checkpointing | **D9 N-3 — NOT AUTHORIZED** | **NOT AUTHORIZED**. **LA-28** classifies retryability only; it implements no policy |
| **BD-P05-02-10** | **A3 gate acceptor** for P05 acceptance | **UNKNOWN** — no person is named in `P00_AUTHORITY_REGISTER.md` or `D9_STATUS.json` | **UNKNOWN**. Blocks **acceptance**, not P05-02. The only person-level hard blocker |

---

## 4. Explicit non-resolutions

This work package did **not**:

1. **Select, name, contact or bind a provider.** Selection remains **NONE MADE**.
2. **Provision a credential, API key, token, secret or endpoint.** All are `REQUIREMENT_ONLY`.
3. **Populate the entitlement matrix.** It remains **EMPTY** (**EM-2**), which is the correct state.
4. **Perform live ingestion**, or claim that authenticated ingestion works.
5. **Produce provider evidence**, or claim that provider integration tests pass.
6. **Resolve OI-P04-04** (FIGI sourcing/licensing/coverage) or **OI-P04-03** (tenant/region).
7. **Invent** a tenant/region attribute, a provider entitlement value, or a licensing-coverage claim.
8. **Start P05-04**, or implement any scheduling, backoff, checkpointing or idempotent re-delivery.
9. **Fork the canonical model.** The P05-01 surfaces are imported verbatim (`forked: false`).
10. **Redesign P05-01.** One test file's **scan scope** was adjusted — see §5.
11. **Accept P05**, create `P05_GATE_ACCEPTANCE.md`, or promote P06/P07/P08.
12. **Change** OI-08, OI-09, OI-10, ADR-01 **C1–C6**, or any accepted P01/P02/P04 artifact.
13. **Modify existing-IIPS** implementation, methodology, scoring, calibration or taxonomy.
14. **Resolve AD-17, M-1, M-5, M-6**, or convert any `DEFERRED` item to `PASSED`.

---

## 5. ⚠ One change to a P05-01 test file — disclosed in full

`p05/tests/no-provider-dependency.test.js` was modified. This is disclosed rather than buried,
because it touches a P05-01 artifact.

**What happened.** Two existing assertions are **lexical proxies** for behavioural claims, written
when `src/` contained only the eight P05-01 modules:

| Test | Assertion | Why it fired |
|---|---|---|
| *"P05-02 — no live provider execution was performed"* | `doesNotMatch(text, /authenticat\w*\s*\(/i)` over every file in `src/` | The P05-02 contract module legitimately **names** an `authenticate` phase — which D9 **A-2** authorizes as *"contract shape"* |
| *"P05-04 — no orchestration … is implemented"* | `doesNotMatch(code, /\bretr(y\|ies\|ying)\b/i)` over every file in `src/` | The P05-02 contract module names the **retry-class table** — which D9 **A-2** authorizes as *"error taxonomy mapping"* |

**What was changed.** Each assertion now enumerates the **P05-01 modules explicitly**
(`P05_01_SOURCE_FILES`) and applies to exactly that set, **unchanged in substance**. The scheduler,
async-orchestration and checkpointing assertions still apply to **every** file in `src/`, including
the new one.

**What was added — strictly stronger, not weaker.**

| Added assertion | Applies to |
|---|---|
| No transport module imported (`node:http\|https\|net\|tls\|dgram`) | the P05-02 module |
| No ambient credential source read (`process.env`) | the P05-02 module |
| No private-key material | the P05-02 module |
| No backoff, no retry loop (`while (`, `for (let attempt`), no mutated attempt counter, no `sleep(`/`delay(` | the P05-02 module |
| The P05-01 feed still declares `credentialsRequired: false` and `providerKind: 'LOCAL_FIXTURE'` | the P05-01 feed |

Plus, in `p05/tests/adapter-contract.test.js`: the **whole contract pipeline is executed with
`globalThis.fetch` made to throw**, and it still succeeds — a **behavioural** proof that nothing
reached out, which a lexical scan cannot provide.

**No P05-01 assertion was weakened, and none was deleted.** The full suite is
**192/192 PASS** (118 P05-01 + 74 P05-02).

---

## 6. Non-blocking improvement identified

**`p05/fixtures/identity-fixtures.json` exercises only 2 of the 5 lifecycle states** — `active` and
`delisted`. `suspended`, `merged` and `superseded` are unexercised (**BD-P05-02-07**). Adding fixtures
for them would close the lifecycle coverage gap **without touching any boundary**, and would exercise
**LC-4** (successor references for `merged`/`superseded`). It was **not** done here, because it
belongs to P05-01's fixture set and this package is additive.
