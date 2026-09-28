# Institutional Investment Platform System (IIPS)
# P01-01 CANONICAL IDENTIFIER SPECIFICATION v1.0.0 — ACCEPTANCE ACT

**Act ID:** `p01-01-acceptance-act-2026-09-28-001`
**Act Type:** ACCEPTANCE_AUTHORITY_ACT (adjudication only; **not** an execution, **not** a certification, **not** an implementation authorization, **not** an integration authorization, **not** a tracker status mutation)
**Governing Standards:** AD-01..AD-18 / AD-CHARTER-2026-01 / P00 phase-gate model (Work Tracker row P01-01)
**Governing Gate:** `P01-01-ACCEPTANCE`
**Acceptance Authority:** **SAI** — designated A3 acceptor for P01-01
**Accepted By:** SAI — exercising the P01-01 acceptance authority designated by
`evidence/target-shell-integration/P01-01-A3-ACCEPTANCE-AUTHORITY-DESIGNATION-ACT.md`
(commit `4dda3edd6f8f7d258118be2ce39bf5815386a02c`; **ACCEPTANCE AUTHORITY ONLY**, P01-01 only,
artifact-scoped, one-time / non-standing)
**Recording Agent:** Arena (recording only; executor of the prior P01-01 execution;
**acceptance ≠ execution** — the Recording Agent does not accept its own output)
**Execution Mode:** NON_PRODUCTION / LOCAL_FIXTURE_AND_OFFLINE_DEV — UNCHANGED
**Recorded At (local, Asia/Calcutta):** 2026-09-28
**Antecedent execution commit:** `e716bf1f4bb1c32199f57f43de54f0b67daa6b72`

---

## 0. ANTECEDENT STATE (fail-closed re-verification)

| Check | Result |
|---|---|
| Repository / branch | `ramkivs/iips-production-market-data` / `arena/01a0e6d9-iips-production-market-data` |
| PMD `main` | `4d3e1cdca3a33da0ec3be8b336b17128108a502c` — **UNCHANGED** (expected baseline confirmed) |
| Designation act present | `P01-01-A3-ACCEPTANCE-AUTHORITY-DESIGNATION-ACT.md` committed at `4dda3edd…`; designates **SAI**, P01-01 only, **ACCEPTANCE AUTHORITY ONLY** |
| Execution record present | `P01-01-CANONICAL-IDENTIFIERS-EXECUTION-RECORD.md` (Record ID `p01-01-canonical-identifiers-execution-record-2026-09-27-001`) |
| Prior P01-01 acceptance act | **NONE** (checked by absence) |
| Tracker P01-01 status at adjudication | **NOT STARTED** (unchanged; see §13) |
| Repository-universe boundary | Four repositories only (`iips-production-market-data`, `iips-review-recovered`, `IIPS`, `Cockpit`). `iips-engineering-standards-`, `Portfolio_Analyzer`, `finapp`, `finapp-authoritative`, `CapStew` and all others **excluded and not used** |

## 1. P01-01 IDENTITY (authoritative, verbatim)

Work Tracker row (verbatim):

```
P01-01 | P01 | Contracts | Canonical identifiers | Define instrument/company/portfolio/research/event
identifiers and cross-provider mapping semantics. | Canonical ID specification | P00-02 | Hard |
Baseline reconciled | IDs versioned and testable | Contract tests | ID contract + fixtures |
Phase gate | NOT STARTED | High | W1 | WS-A Governance & Contracts | YES | — | Phase-gate dependency
controls entry/exit; no dependency bypass.
```

**Acceptance question adjudicated:** does the committed P01-01 execution at `e716bf1f` provide
sufficient authoritative evidence that the tracker-defined P01-01 requirement, deliverable,
validation, evidence, and exit condition are satisfied for the executable
`src/contracts/canonical_id_specification.ts` v1.0.0?

## 2. CANDIDATE IDENTITY AND IMMUTABILITY VERIFICATION

| Check | Result |
|---|---|
| Candidate commit | `e716bf1f4bb1c32199f57f43de54f0b67daa6b72` — **verified present** in `iips-production-market-data` |
| Parent | `6b7552b642b92c0b783d4c190e409c4ce116e932` (P01 Wave-1 execution authority act) |
| Candidate branch | `arena/01a0e30c-iips-production-market-data` @ `e716bf1f…` — **verified** |
| Executable artifact at commit | `src/contracts/canonical_id_specification.ts` — present, **9,834 bytes**, sha256 `f34fce385a9fa0cb535317ed173fe3fa2e8388641fa11b2fca463bb18818110f` |
| Candidate content corresponds to P01-01 | ✓ `CANONICAL_ID_SPECIFICATION_ID = 'P01-01-CANONICAL-ID-SPECIFICATION'`, `CANONICAL_ID_SPECIFICATION_VERSION = '1.0.0'`, 7 identifier kinds, grammars, validators, descriptor |
| Tests/evidence correspond to this candidate | ✓ `tests/p01_01_canonical_identifiers.contract.test.ts` imports `../src/contracts/canonical_id_specification.js`; fixtures `tests/fixtures/p01_01_canonical_id_fixtures.json` pin the same `specificationId`/`specificationVersion` |
| Independent extraction | Full tree extracted **directly at `e716bf1f`** (345 files) — not from a nearby commit, branch tip, or working tree |
| Later unverified changes substituted | **NONE** — all evidence read from the `e716bf1f` tree |

**No substitution occurred. Candidate scope and identity VERIFIED.**

## 3. ACCEPTANCE AUTHORITY = SAI (verified; not inferred)

1. Designation act `4dda3edd…` header, verbatim: **"Designated A3 Acceptor: SAI"**; §2:
   **"SAI DESIGNATED AS A3 ACCEPTANCE AUTHORITY FOR P01-01"**, **"Scope: P01-01 only"**.
2. Designation act §4: authority is **"ACCEPTANCE AUTHORITY ONLY"**, **"limited to the acceptance
   determination for the exact P01-01 executable capability"**, and expressly includes the power to
   **"issue a separate, explicit P01-01 acceptance act recording ACCEPTED, REJECTED, or QUALIFIED for
   that exact capability."** **This act is that act.**
3. Designation act §2.1 non-inference attestation disclaims every alternative basis (Sai's A2
   certification authority, Sai's P07/P08/P09 A3 roles, program role, standing capacity, Ramki's
   P05/P06/P10 acceptances, Raji's P11 acceptance, `P00-02`'s holder-reserved function, involvement in
   P01-01, repository ownership/authorship). The designation rests **solely** on the express Program
   Authority designation.
4. Designation act §6/§7: the designation is **one-time, phase-scoped and artifact-scoped**, confers
   **no standing capacity**, and does not transfer. **No authority beyond that scope is exercised here.**

## 4. AUTHORITATIVE ACCEPTANCE CRITERIA (discovered, not invented)

Criteria are taken **verbatim** from the Work Tracker row for P01-01, as recorded in
`P01-WAVE1-EXECUTION-AUTHORITY-DESIGNATION-ACT.md` §3 and §11–§12. Per that act §11:
**"No technical acceptance criteria beyond the tracker are invented by this act."**

| # | Tracker field | Verbatim criterion |
|---|---|---|
| **C1** | Requirement | "Define instrument/company/portfolio/research/event identifiers and cross-provider mapping semantics." |
| **C2** | Deliverable | "Canonical ID specification" |
| **C3** | Test / Validation | "Contract tests" |
| **C4** | Evidence | "ID contract + fixtures" |
| **C5** | **Exit Criteria** | **"IDs versioned and testable"** |
| **C6** | Entry Criteria | "Baseline reconciled" (dependency `P00-02`, type **Hard**) |

**No generic software-quality criteria were substituted.** No criterion was added, removed, or
reinterpreted.

## 5. CRITERION-BY-CRITERION EVIDENCE

### C1 — Requirement: "Define instrument/company/portfolio/research/event identifiers and cross-provider mapping semantics." → **SATISFIED**

| Element | Evidence at `e716bf1f` |
|---|---|
| **instrument** identifiers | `ISIN` `^[A-Z]{2}[A-Z0-9]{9}[0-9]$`; `EXCHANGE_SYMBOL` `^[A-Z][A-Z0-9]{1,19}$`; `COMPOSITE_TICKER` `^(NSE\|BSE):([A-Z][A-Z0-9]{1,19}\|[0-9]{6})$` |
| **company** identifiers | `COMPANY_ID` `^EQ_[A-Z0-9]{3,20}_IN$` |
| **portfolio** identifiers | `PORTFOLIO_ID` `^PF_[A-Z0-9][A-Z0-9_]{1,30}$` |
| **research** identifiers | `RESEARCH_ID` `^RSRCH_[A-Z0-9][A-Z0-9_-]{0,38}$` |
| **event** identifiers | `EVENT_ID` `^EVT_[A-Z0-9]{2,14}_[0-9]{8}_[0-9]{2,4}$` |
| **cross-provider mapping semantics** | Declared as a **normative reference** to the certified `src/identity/mapping_store.ts` — `crossProviderMappingSemantics.normativeReference = 'src/identity/mapping_store.ts'`, `reimplemented: false`; taxonomy `ISIN\|CIN\|NSE_SYMBOL\|BSE_SYMBOL\|COMPOSITE_TICKER`; point-in-time effective-dated resolution to `COMPANY_ID`; fail-closed `IdentityAmbiguityError` (`UNMAPPED_IDENTIFIER` / `AMBIGUOUS_COLLISION`) into the quarantine sink |

All five identifier families and the cross-provider mapping semantics are **defined**.

### C2 — Deliverable: "Canonical ID specification" → **SATISFIED**

`docs/P01-01-CANONICAL-ID-SPECIFICATION.md` (+67 lines) — specification ID and version, program item,
requirement quoted verbatim, authority, execution mode, all 7 kinds with grammars and per-kind evidence
basis, strict-validation and fail-closed rules, normalization seam, cross-provider mapping semantics,
versioning policy, 7 recorded limitations, and exit-condition tracking.

### C3 — Test / Validation: "Contract tests" → **SATISFIED**

`tests/p01_01_canonical_identifiers.contract.test.ts` (+254 lines) — 14 contract tests T01–T14,
`node:test` / `node:assert`, offline.

**Recorded execution history** (execution record §6–§7, honest run history, no green-washing):
`tsc` exit 0 · Run 1 **11/14** (three executor-side defects) → corrections recorded → Run 2 **12/14**
(two further executor-side defects) → corrections recorded → Run 3 **14/14 PASS** · determinism
re-run **14/14 PASS (identical)** · certified coexistence suite `wsa_p01_contracts.test.ts`
**7/7 PASS**.

**Independent static re-verification performed at this gate** (grammar/fixture correspondence
re-derived from the `e716bf1f` tree, not taken on trust):

| Check | Result |
|---|---|
| T01 version pin (`specificationId` / `specificationVersion` = module constants) | **PASS** |
| T03 all valid fixtures accepted by their grammar (30 values across 7 kinds) | **PASS** |
| T04 all invalid fixtures rejected by their grammar (35 values across 7 kinds) | **PASS** |
| T06 normalization seam (4 cases: normalized valid, raw strictly invalid) | **PASS** |
| T07/T08 fail-closed parse + determinism spot checks | **PASS** |
| T09 every legacy opaque form recorded as non-conformant legacy evidence | **PASS** |
| Module export surface ⊇ test import surface (8/8 symbols) | **PASS** |
| All test imports resolve to files present at `e716bf1f`; all referenced fixtures present | **PASS** |

**Stated limitation:** `node`/`tsc` were **not executed at this gate** (no `node_modules`; installing
packages is prohibited). Test outcomes therefore rest on the **recorded execution evidence**
corroborated by the independent static re-verification above. This limitation is **informational and
non-blocking**; it is recorded, not converted into either acceptance or rejection.

### C4 — Evidence: "ID contract + fixtures" → **SATISFIED**

| Element | Artifact | Size |
|---|---|---|
| **ID contract** | `src/contracts/canonical_id_specification.ts` | +197 lines, 9,834 bytes |
| **Fixtures** | `tests/fixtures/p01_01_canonical_id_fixtures.json` | +79 lines, 4,926 bytes |

Fixture content verified: `specificationId`/`specificationVersion` pinned · `valid` and `invalid`
maps for all 7 kinds · 7 `missingValueKinds` · 4 `normalizationCases` · `reuseAnchors`
(`securityMasterEntities`, `pointInTimeMapping`) · 5 `legacyEvidence` entries · `provenance`
(authorization, governedEntitySource, isinSource, eventIdModel).

### C5 — Exit Criteria: "IDs versioned and testable" → **SATISFIED**

**Versioned:**
- Single version of record: `CANONICAL_ID_SPECIFICATION_ID = 'P01-01-CANONICAL-ID-SPECIFICATION'`,
  `CANONICAL_ID_SPECIFICATION_VERSION = '1.0.0'` (MAJOR.MINOR.PATCH).
- **Fixture-pinned**: `FIXTURES.specificationVersion === CANONICAL_ID_SPECIFICATION_VERSION` and
  `FIXTURES.specificationId === CANONICAL_ID_SPECIFICATION_ID` — asserted by **T01**.
- **Deterministic exposure**: `canonicalIdSpecificationDescriptor()` returns a frozen descriptor whose
  `version` equals the constant — asserted by **T02** (deep-equality across repeated calls).
- **Versioning policy** stated in the spec deliverable §5: any grammar/kind/normalization/mapping
  change requires a MAJOR.MINOR.PATCH bump and a new governed specification record.

**Testable:**
- T03–T05 — strict validation of all 7 kinds (valid accepted; malformed → `STRUCTURAL_MALFORMATION`; missing → `MISSING_MANDATORY_FIELD`).
- T06 — normalization seam is deterministic and identical to certified mapping-store semantics; raw forms strictly invalid.
- T07 — parse succeeds for canonical values and **fails closed** with the typed `CanonicalIdContractError`.
- T08 — validation results deterministic across repeated calls.
- T09 — certified D05 contract semantics retained; legacy opaque `companyId` boundary **recorded, not repaired**.
- T10–T13 — cross-provider mapping resolution, point-in-time effective dating, fail-closed quarantine, and ambiguity failure all exercised **through the certified classes**.
- T14 — **no competing mapping implementation introduced**.

### C6 — Entry Criteria: "Baseline reconciled" (dependency `P00-02`, Hard) → **SATISFIED**

`P00-02` **ACCEPTED** by `P00-02-BASELINE-RECONCILIATION-ACCEPTANCE-ACT.md` (commit `2d3c9718…`):
"P00-02 ACCEPTED / EXIT CONDITION SATISFIED / BASELINE AND GAPS RECORDED". The Hard dependency is
satisfied and the entry criterion "Baseline reconciled" is supported. Per that act §11, P01-01's entry
criterion "is now supported by an accepted P00-02 act."

## 6. PRESERVATION AND NON-REGRESSION EVIDENCE (material to acceptance)

| Check | Result |
|---|---|
| Candidate is **purely additive** across `main..e716bf1f` | **25 files added; 0 modified; 0 deleted** |
| All 13 certified contract modules byte-identical to `main` (`envelope.ts`, `provenance.ts`, `types.ts`, `index.ts`, `d01`–`d09`) — verified by git blob SHA-1 | **IDENTICAL ×13** |
| **B1/IRR P01-01 Canonical Envelope** (`src/contracts/envelope.ts`) untouched | blob `88f4efd0be8fa87a079e2ad19aab5c1f3f319a0b` = `main` — **UNMODIFIED** |
| **D115 canonical identity allocator** present in candidate? | **ABSENT** — not in this lineage |
| **`docs/p01/` documentation package** present in candidate? | **ABSENT** — not in this lineage |
| ISIN grammar identical to certified D05 contract | `d05_security_master.ts:51` `/^[A-Z]{2}[A-Z0-9]{9}[0-9]$/` = `canonical_id_specification.ts:66` — **IDENTICAL** |
| Normalization identical to certified mapping store | `mapping_store.ts:46` `identifierValue.trim().toUpperCase()` = `normalizeCanonicalIdValue` — **IDENTICAL** |
| No second mapping implementation | test imports `SecurityMaster`, `IdentityMappingStore`, `IdentityAmbiguityError` directly; `reimplemented: false` — **CONFIRMED** |
| Reuse anchors resolve through the certified layer | T10: `NSE:RELIANCE` → `EQ_RELIANCE_IN`; `INE009A01021` → `EQ_INFY_IN`; `infy` (lowercase) → `EQ_INFY_IN`; `BSE:RELIANCE` → `EQ_RELIANCE_IN` |
| Certified coexistence suite unaffected | `wsa_p01_contracts.test.ts` **7/7 PASS** (suite untouched by the additive module) |
| Existing PMD identifiers altered? | **NO** — legacy opaque forms recorded as limitations, explicitly **not repaired** |

## 7. OI-09 / DOCUMENTATION RECONCILIATION

**What OI-09 is** (verbatim from the `docs/p01/` package):

| Source | Verbatim |
|---|---|
| `P01_DEPENDENCY_REGISTER.md:13` | "**OI-09** — external identifier standard \| **OPEN** \| `externalIdentifiers[]` slot exists; no standard is assumed authoritative \| **NO** \| P04" |
| `P01_DATA_CONTRACT.md:167` | "External identifier standard (ISIN/FIGI/CUSIP/…) \| **OI-09 — OPEN** \| P04" |
| `P01_IDENTITY_AND_LINEAGE.md:50` | "**OI-09** external identifier standard (ISIN / FIGI / CUSIP — none assumed authoritative) \| **OPEN** \| P04" |
| `P01_GATE_ACCEPTANCE.md:110` | "**OI-08 / OI-09** \| **OPEN** — blocking P04" |

**1. The exact P01-01 acceptance criterion governing this issue.**
OI-09 is **not** among the tracker-defined P01-01 acceptance criteria (§4: C1–C6). OI-09 is an open
item of the `docs/p01/` **documentation package**, explicitly routed to **P04** — a different work
item. The governing P01-01 criteria are the tracker's Requirement, Deliverable, Test/Validation,
Evidence, and Exit Criteria.

**2. Is the executable specification required to resolve OI-09?**
**No.** OI-09 concerns which **external identifier standard** is authoritative for the
`externalIdentifiers[]` slot — a P04 (Security Master) concern. P01-01's tracker requirement is to
define **canonical value grammars** for identifier kinds and to declare cross-provider mapping
semantics. Resolving OI-09 would require adopting an external standard as authoritative, which is
outside P01-01's tracker-defined scope.

**3. Do the candidate's explicit grammar choices satisfy or violate the applicable criterion?**
**Neither — they are out of OI-09's scope.** Specifically:
- The ISIN grammar is **reused identically from the certified D05 contract**
  (`d05_security_master.ts:51`), not newly adopted. It is a *reuse*, not a standard election.
- Recorded limitation 5 states verbatim: *"ISIN validation is structural only — same limitation as the
  D05 contract (ISO-6166 check digit not verified)."* The candidate claims **no** ISO-6166 authority.
- No FIGI or CUSIP authority is introduced anywhere in the candidate.
- `crossProviderMappingSemantics.reimplemented = false` and the identifier-type taxonomy is
  **inherited** from the certified mapping store — not elected by this module.
- The candidate therefore **neither resolves nor violates OI-09**; it leaves it exactly where the
  documentation package left it.

**4. Repository precedent.**
`P01_GATE_ACCEPTANCE.md` accepted the `docs/p01/` package **with OI-09 open**: §5 records
`OI-08 / OI-09 | OPEN — blocking P04` while `P01 | ACCEPTED`; §6 item 9 states P01 acceptance does
**not** mean "OI-08, OI-09, AD-17, M-1, M-5 or M-6 are resolved"; §2 states "Every boundary it touches
but does not own — OI-08, OI-09, OI-10, AD-17, M-1, M-5, M-6, OI-05, OI-06, CD-01 — is preserved
unresolved and attributed to its owning phase or authority."

**Conclusion: OI-09 is INFORMATIONAL, not a blocking criterion.** The existence of OI-09 is **not**
treated as acceptance failure, and the candidate's concrete ISIN/`COMPANY_ID` grammars are **not**
treated as resolving it. OI-09 remains **OPEN and attributed to P04**, unchanged by this acceptance.
No assumption was made in either direction.

## 8. LABEL-COLLISION CONFIRMATION

Acceptance applies **only** to:

> **P01-01 — Canonical Identifier Specification v1.0.0**,
> executable artifact `src/contracts/canonical_id_specification.ts`,
> at `e716bf1f4bb1c32199f57f43de54f0b67daa6b72`.

It does **not** apply to, and is **not** evidence for:

| Excluded artifact | Verification |
|---|---|
| **B1/IRR P01-01 — Canonical Envelope & Validation Engine** | `src/contracts/envelope.ts` blob identical to `main`; untouched; a different capability sharing only the `P01-01` label |
| **D115 canonical identity allocator** | **ABSENT** from the candidate lineage |
| **`docs/p01/` documentation package** | **ABSENT** from the candidate lineage; and expressly **not** treated as acceptance evidence for the executable module |
| **P01-02** | Not executed; acceptance authority **UNRESOLVED / NOT YET DESIGNATED**; out of scope |
| **D7-TIER3** | Engine parity/independence programme; no identifier-specification scope |
| **B1 engine certification** | IES-016/017/020 only; engine scope |
| Any other `P01`/`canonical` artifact | Not the subject |

**No capability was collapsed into another on the basis of filename or terminology overlap.**

## 9. EXPLICIT ACCEPTANCE DISPOSITION

> ## **P01-01 ACCEPTED**
> **EXIT CONDITION = SATISFIED — "IDs versioned and testable"**
> **ALL SIX TRACKER-DEFINED CRITERIA (C1–C6) = SATISFIED**
>
> Disposition basis: §1–§8 of this act, on the committed execution at
> `e716bf1f4bb1c32199f57f43de54f0b67daa6b72` under the committed P01 Wave-1 execution authority act
> `6b7552b642b92c0b783d4c190e409c4ce116e932`, exercising the acceptance authority designated at
> `4dda3edd6f8f7d258118be2ce39bf5815386a02c`.

## 10. RATIONALE PER MANDATORY CRITERION (summary)

| # | Criterion | Result | Basis |
|---|---|---|---|
| C1 | Requirement — define all five identifier families + cross-provider mapping semantics | **SATISFIED** | 7 kinds with grammars + normative-reference mapping semantics (§5-C1) |
| C2 | Deliverable — "Canonical ID specification" | **SATISFIED** | `docs/P01-01-CANONICAL-ID-SPECIFICATION.md` (§5-C2) |
| C3 | Test / Validation — "Contract tests" | **SATISFIED** | 14 contract tests T01–T14; 14/14 recorded; independently statically re-verified (§5-C3) |
| C4 | Evidence — "ID contract + fixtures" | **SATISFIED** | `canonical_id_specification.ts` + `p01_01_canonical_id_fixtures.json` (§5-C4) |
| C5 | **Exit Criteria — "IDs versioned and testable"** | **SATISFIED** | version constant + fixture pin + deterministic descriptor; 14 tests across all 7 kinds (§5-C5) |
| C6 | Entry Criteria — "Baseline reconciled" (P00-02 Hard) | **SATISFIED** | P00-02 ACCEPTED at `2d3c9718` (§5-C6) |

**Unsatisfied criteria: NONE.**

**Informational limitations (non-blocking; do not defeat acceptance):**
1. The module's 7 recorded limitations stand verbatim (legacy opaque `INFY`/`TCS`/`DEFAULT` forms;
   `NEWS-` legacy event form; real-world symbols with `&`/`-` excluded fail-closed; ISIN
   structural-only; `PORTFOLIO_ID`/`RESEARCH_ID`/`EVENT_ID` grammars are NEW without baseline
   precedent; `COMPANY_ID` range deliberately bounded).
2. **OI-09 remains OPEN**, attributed to P04 (§7) — informational, not a P01-01 criterion.
3. **U1** (INT-001 interface mapping) from the P00-02 reconciliation remains **UNRESOLVED — carried**
   per its own P00/P01 discovery routing; not adjudicated here and not a P01-01 criterion.
4. Real-world (production) identifier coverage beyond the offline governed corpus is out of scope by
   design (`NON_PRODUCTION` mode).
5. `node`/`tsc` were not executed at this gate; test outcomes rest on recorded execution evidence plus
   independent static re-verification (§5-C3).

**Post-acceptance concerns (recorded, not resolved here):**
- P01-03's entry criterion ("ID contract drafted") becomes *visible*; its satisfaction follows only
  from this acceptance and its own governed determination. **Not determined here.**
- The 7 recorded limitations may be addressed only by a later **governed specification version** with
  a new fixture pin.

## 11. DOWNSTREAM BOUNDARY (explicit — acceptance does NOT authorize)

This act authorizes **NONE** of:

- **certification** of P01-01, or any certification authority;
- **implementation** or **adaptation** of anything, anywhere;
- **integration** of the candidate into PMD `main` (no merge, cherry-pick, rebase, or copy);
- modification of D05 Security Master, `src/identity`, `src/d114`,
  `frontend/src/features/portfolio`, `src/ui`, or any frozen tree;
- modification of the existing canonical envelope/validation engine;
- modification of identifiers already used by PMD;
- persistence, UI, provider-integration, or OIDC changes;
- **production activation**;
- **Dhan / NSE / live-market-data** access;
- **credential** authorization;
- P01-02, P01-03, P01-04, P01-05, P02–P17, INT-011, Watchlists, SG-4/SG-5, or D115 work;
- any tracker status mutation.

**Acceptance is not implementation. Acceptance is not certification. Certification is not production
authority.**

## 12. SEPARATION OF ACTS (explicit)

Execution was performed by the designated executor (Arena, Recording Agent) and committed at
`e716bf1f`. Acceptance was reserved to the designated A3 acceptor (**SAI**) and is exercised in this
act only. The execution record is **not modified** by this act; this act does not back-date, amend, or
self-accept the executor's output. **Two acts, two commits, two checkpoints.**

## 13. TRACKER STATUS RULE (explicit — separately governed mutation)

The Work Tracker status was **not** changed by this act. The tracker still reads `P01-01 = NOT
STARTED`. A formal status mutation (if any) is a **separately governed action**; nothing in this
acceptance act is used to make downstream gates appear open. The acceptance established here is
recorded in this artifact as the governing evidence for any such later, separately governed status
action.

## 14. ACCEPTANCE DATE/TIME

2026-09-28 (local, Asia/Calcutta). One adjudication pass; one artifact.

## 15. SINGLE-ARTIFACT ATTESTATION

This is the **only artifact created by this acceptance act** (no competing acceptance artifact, no
acceptance-decision record variant). No source, test, fixture, tracker, matrix, execution-record,
certification, or Watchlists artifact was created, modified, renamed, deleted, or regenerated in this
pass.

## 16. NEXT SINGLE GOVERNED STEP (named; NOT performed)

> ## `P01-01-SCOPED-CERTIFICATION-AUTHORITY-DESIGNATION`

Certification authority for P01-01 is **NOT designated**. A separate, explicit certification-authority
designation act is required before any certification act. Certification is **not** performed, implied,
or pre-judged by this acceptance. Integration into PMD `main` may be considered only after the
appropriate acceptance **and** certification gates.

---

**Adjudication attestation:** Adjudicated and recorded under SAI's explicitly designated P01-01 A3
acceptance authority (`4dda3edd…`); candidate identity and immutability independently verified at
`e716bf1f`; criteria discovered verbatim from the authoritative tracker and **not invented**;
evidence-based (§5–§7); OI-09 preserved open and attributed to P04 without assumption in either
direction; no label collision; no acceptance manufactured against absent evidence; no certification,
implementation, integration, or production authority granted.
