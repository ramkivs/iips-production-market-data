# P05-01 — BOUNDED DEPENDENCIES AND OPEN ITEMS

**Item:** P05-01 — Local deterministic market feed
**Authorization:** `docs/d9/D9_P05_ENTRY_AUTHORIZATION.md` §3 A-1
**Status of P05-01:** **IMPLEMENTED / EVIDENCED** — ⚠ **P05 NOT ACCEPTED**

> Per the D9 discipline: where implementation would require something outside the authorized
> scope, the dependency is **recorded as a bounded dependency** and only the independently
> executable portion is performed. Nothing here resolves an open item by recording it.

---

## 1. Open items — unchanged by this execution

| ID | Subject | State | Effect on P05-01 |
|---|---|---|---|
| **OI-P04-04** | FIGI sourcing / licensing / coverage | **OPEN** | ⚠ **NOT resolved.** P05-01 uses **synthetic, clearly non-real** FIGI values (`BBG00SYNTH01`…`04`) from a fixture and makes **no** sourcing, licensing or coverage claim. No FIGI source is named or contacted. Blocks P05-03 licensed depth; does **not** block P05-01 |
| **OI-P04-03** | Per-record tenant/region governance attribute set | **OPEN** | ⚠ **NOT resolved.** No per-record governance is applied and **no attribute is invented, inferred or defaulted**. IB-1…IB-5 remain bound. D01/D02/D10 are not licence-restricted (D06/D09), so no `governanceClassification` is required and the slot is left **empty** rather than filled with a guess. Declared as a first-class A-8 limitation |
| **OI-08** | Identity cardinality 1:N | **RESOLVED — UNALTERED** | Implemented as MC-1…MC-7. Evidence: one issuer → 2 securities; 3 securities → 1 `companyId` |
| **OI-09** | FIGI/OpenFIGI authoritative | **RESOLVED — UNALTERED** | Implemented as XI-1…XI-8. ISIN/CUSIP/SEDOL non-authoritative; no fallback |
| **OI-10** | Namespace token `MD:` / `MD:<domain>.<field>` | **RESOLVED — UNALTERED** | Implemented verbatim; `namespaceVersion` `1.0`. **Not reopened, not redesigned** |
| **ADR-01 C1–C6** | Collision rules | **UNCHANGED (6 of 6)** | Implemented mechanically — see §3 |
| **M-1 / AD-4** | existing-IIPS revalidation | `OPEN_REVALIDATION_REQUIRED` | External. E2E-030 neither revoked nor renewed |
| **M-5** | Authentication/session not wired | **OPEN** | C12 BLOCKED. Out of P05-01 scope |
| **M-6** | Retention not enforced | **OPEN** | Recording `retentionDays` is not an enforcement claim |
| **AD-17 / M-2** | `ReplayService` literals | **UNRESOLVED** | The P05-01 replay harness is **not** `ReplayService` and makes no adequacy claim |

---

## 2. OI-D9-01 — CORRECTION (recorded additively)

### 2.1 The observation as originally recorded

`docs/d9/D9_P05_ENTRY_AUTHORIZATION.md` §6 recorded **OI-D9-01** as:

> **Observed state:** the authoritative corpus exemplifies **five** domain-segment labels —
> `MD:price`, `MD:ohlcv`, `MD:valuation`, `MD:fundamentals`, `MD:estimates` — against a ten-domain baseline.
> **Gap:** no domain-segment label is exemplified for **D04, D05, D06, D08, D09, D10**.

### 2.2 What the P05-01 execution found

Implementing P05-01 required the real domain-segment vocabulary, so the accepted field
dictionary was parsed directly rather than relying on literal `MD:` occurrences in the corpus.

**The premise of OI-D9-01 is FACTUALLY WRONG.** `docs/p01/P01_FIELD_DICTIONARY.md` — an
**ACCEPTED** artifact (`P01_GATE_ACCEPTANCE.md`:16 `**ACCEPTED**`) — enumerates a domain
segment for **all ten** domains, written with the `<NS>` placeholder:

| Domain | Dictionary §  | `<NS>` segment(s) |
|---|---|---|
| D01 prices / quotes | §3 | **`price`**, **`valuation`** |
| D02 historical OHLCV | §4 | **`ohlcv`** |
| D03 fundamentals | §5 | **`fundamentals`** |
| D04 corporate actions | §6 | **`corpaction`** |
| D05 identity reference slots | §7 | **`identity`** |
| D06 news / events | §8 | **`news`** |
| D07 estimates / consensus | §9 | **`estimates`** |
| D08 macro | §10 | **`macro`** |
| D09 alternative data | §11 | **`alt`** |
| D10 venue / reference | §12 | **`venue`** |

**Domains with a segment: 10 of 10. Domains with NO segment: none.**
**Distinct segments: 11** (`alt`, `corpaction`, `estimates`, `fundamentals`, `identity`,
`macro`, `news`, `ohlcv`, `price`, `valuation`, `venue`) — D01 carries two.

### 2.3 Why the original observation missed them

The original count was taken over **literal `MD:` occurrences** in the corpus. The dictionary
predates the OI-10 recording and therefore writes its keys as `<NS>corpaction.actionType`,
`<NS>news.headline`, `<NS>macro.value` and so on — using the placeholder, not the token. Those
labels are present and authoritative; they simply do not contain the string `MD:`.

`CHECKPOINT-03.md` §3.3(5) and recovery rule 14 bind `<NS>` → **`MD:`** for **new** P05/P06
work, and §10 states that recording the token later is *"a substitution, not a redesign."*
Applying that substitution to the accepted dictionary is therefore **applying the accepted
contract**, not inventing vocabulary.

### 2.4 Corrected status

| Field | Corrected value |
|---|---|
| **Item** | **OI-D9-01 — enumeration of `MD:<domain>.<field>` domain-segment labels** |
| **Corrected state** | **RESOLVED BY EVIDENCE — no gap exists** |
| **Basis** | `docs/p01/P01_FIELD_DICTIONARY.md` §3–§12 (ACCEPTED, `P01_GATE_ACCEPTANCE.md`:16) |
| **Vocabulary** | 11 segments covering D01–D10, listed above |
| **Basis of the original error** | counted literal `MD:` strings; the dictionary uses the `<NS>` placeholder |
| **Vocabulary invented or altered** | **NO** — every segment is read out of the accepted dictionary |
| **OI-10 reopened or redesigned** | **NO** — token `MD:` and form `MD:<domain>.<field>` preserved exactly |
| **Enforced how** | `p05/tests/namespace.test.js` parses the dictionary and asserts the implementation vocabulary **equals** the dictionary's set exactly |

⚠ **The historical observation is NOT erased.** `docs/d9/D9_P05_ENTRY_AUTHORIZATION.md` §6 and
`docs/d9/D9_STATUS.json` retain their original text; the correction is recorded **by addition**
in those artifacts, in `docs/PROGRAM_STATE.md`, and here — following the corpus's established
additive/supersession convention (the `8` → `8a` → `8b` → `8c` pattern, and
`P00_DECISION_LOG.md` rule 1: *"Entries are append-only. Superseding a decision requires a new
entry citing the prior one."*).

---

## 3. Bounded dependencies recorded, not resolved

| # | Dependency | Why bounded | Discharged where |
|---|---|---|---|
| **BD-P05-01-01** | **DEP-P02-04** — the governed provider-identity register | `P02_PROVIDER_IDENTITY_VERSIONING.md` §5 PG-5 assigns it to **P05** | ✅ **DISCHARGED** — `p05/fixtures/provider-register.json` (PG-1…PG-5) |
| **BD-P05-01-02** | Live provider selection, entitlement, credentials, connectivity | D9 A-2 authorized **specification only**; P16 authority not held | Recorded. **P05-02** |
| **BD-P05-01-03** | Licensed / deeper historical depth | **OI-P04-04 OPEN** | Recorded. **P05-03** |
| **BD-P05-01-04** | Orchestration: scheduling, retries, idempotent checkpointing | **P05-04 NOT AUTHORIZED** by D9 | Recorded. **P05-04** |
| **BD-P05-01-05** | Per-record tenant/region governance | **OI-P04-03 OPEN**, IB-1…IB-5 | Recorded. Requires an explicit A1 act |
| **BD-P05-01-06** | Adjusted-series modelling and PIT storage | **P08 NOT_STARTED**; the feed declares `PIT` unsupported and emits unadjusted bars only (AJ-1 both retained) | Recorded. **P08** |
| **BD-P05-01-07** | D03–D09 domains | Not served by the local feed; the vocabulary exists, the fixtures do not | Recorded. Out of P05-01 scope |
| **BD-P05-01-08** | Freshness thresholds and reconciliation | **P07** — P05-01 supplies only the inputs (`asOf`, `receivedAt`, venue session reference, completeness basis) as Q-4 requires | Recorded. **P07** |
| **BD-P05-01-09** | A3 gate acceptor for P05 acceptance | **UNKNOWN** | Recorded. Blocks acceptance, not P05-01 |
| **BD-P05-01-10** | M-1 / AD-4 revalidation, E2E-030, AD-17 | existing-IIPS authority | Recorded. External |

---

## 4. Explicit non-resolutions

This execution did **not**:

- resolve **OI-P04-04** or **OI-P04-03**;
- alter **OI-08**, **OI-09** or **OI-10**;
- alter **ADR-01 C1–C6**;
- invent or default any tenant/region governance attribute;
- invent or alter any domain-segment label;
- rewrite any accepted P01/P02 historical namespace artifact;
- select a provider or provision a credential;
- accept P05, promote P06/P07/P08, or create `P05_GATE_ACCEPTANCE.md`.
