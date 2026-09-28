# Institutional Investment Platform System (IIPS)
# P01-01 — ACCEPTANCE RE-EXERCISE AGAINST AUTHORIZED CRITERIA

**Act ID:** `p01-01-acceptance-re-exercise-2026-09-28-001`
**Act Type:** ACCEPTANCE-RE-EXERCISE-RECORD (adjudication against newly authorized criteria;
**not** a new implementation, **not** a new execution, **not** an integration, **not** a
certification, **not** a certification-authority designation, **not** a rewrite of historical
governance, **not** a general tracker-authority designation)
**Governing Gate:** `P01-01 ACCEPTANCE RE-EXERCISE AGAINST AUTHORIZED CRITERIA`
**Governing Standards:** AD-01..AD-18 / AD-CHARTER-2026-01 / P00 phase-gate model
**Authorized criteria authority:** `evidence/target-shell-integration/P01-01-ACCEPTANCE-CRITERIA-AUTHORITY-ACT.md`
@ `7eec2d197ab6b967c153edd5151b4e37abe0f806` (Program Authority: **RAMKI**; **Option A — tracker
explicitly authorized for P01-01 only**)
**Acceptance authority exercised by:** **SAI** — designated A3 acceptor for P01-01 per
`P01-01-A3-ACCEPTANCE-AUTHORITY-DESIGNATION-ACT.md` @ `4dda3edd6f8f7d258118be2ce39bf5815386a02c`
**Recording Agent:** Arena (recording only)
**Recorded At (local, Asia/Calcutta):** 2026-09-28
**Repository / Branch:** `ramkivs/iips-production-market-data` /
`arena/01a0e6d9-iips-production-market-data`

---

## 0. WHAT THIS RECORD IS

This is a **re-exercise of the existing P01-01 acceptance determination against the newly
authorized acceptance criteria**. The authoritative criteria are those established by the
acceptance-criteria authority act @ `7eec2d1`. **The prior unauthorized tracker basis is not
substituted.** No criterion was broadened and no additional criterion was invented.

**The original acceptance act is preserved as the historical record being re-exercised:**

| Record | Status |
|---|---|
| `P01-01-ACCEPTANCE-ACT.md` @ `9c9e606d2a822984fecae103aab9a1ff9a1dd88e` (blob `5f355db6…`) | **NOT rewritten, NOT modified, NOT revoked, NOT replaced, NOT cherry-picked, NOT rebased.** Its criteria and contents are untouched. |

---

## 1. AUTHORIZED ACCEPTANCE BASIS

Per the acceptance-criteria authority act §4:

| Field | Value |
|---|---|
| Tracker artifact | `…TRACKER_INTEGRATION_ALIGNED.xlsx` (read-only) |
| Checksum | `f0bd7b970c445f0a06e793256456231f` |
| Sheet | `Work Tracker — Production Schedule` |
| **Row authorized** | **`P01-01` — P01 / Contracts / Canonical identifiers** — **only this row** |

The authorization is **bounded to P01-01 only** and **does not establish general tracker authority**.

### 1.1 Authorized criteria C1–C6

| # | Tracker field | Authorized criterion |
|---|---|---|
| **C1** | Requirement | "Define instrument/company/portfolio/research/event identifiers and cross-provider mapping semantics." |
| **C2** | Deliverable | "Canonical ID specification" |
| **C3** | Test / Validation | "Contract tests" |
| **C4** | Evidence | "ID contract + fixtures" |
| **C5** | Exit Criteria | "IDs versioned and testable" |
| **C6** | Entry Criteria | "Baseline reconciled" (dependency `P00-02`, type **Hard**) |

---

## 2. CANDIDATE VERIFICATION

| Check | Result |
|---|---|
| Repository | `iips-production-market-data` |
| Candidate branch | `arena/01a0e30c-iips-production-market-data` |
| Candidate tip | `e716bf1f4bb1c32199f57f43de54f0b67daa6b72` — **MATCH** |
| Candidate parent | `6b7552b642b92c0b783d4c190e409c4ce116e932` (P01 Wave-1 execution-authority act) |
| Independent extraction | Full tree extracted **directly at `e716bf1f`** (345 files); module sha256 `f34fce385a9fa0cb535317ed173fe3fa2e8388641fa11b2fca463bb18818110f` |
| Artifact provenance | All five P01-01 artifacts **committed** (added) at `e716bf1f` — verified via commit diff and blob SHAs; **not** local/untracked |

---

## 3. CRITERION-BY-CRITERION RE-EXERCISE

### C1 — Requirement: "Define instrument/company/portfolio/research/event identifiers and cross-provider mapping semantics." → **PASS**

Evidence read **from the committed module source** at `e716bf1f` (not merely file existence):

| Authorized element | Actually defined | Evidence |
|---|---|---|
| **company** identifiers | ✅ | `COMPANY_ID` → `/^EQ_[A-Z0-9]{3,20}_IN$/` |
| **portfolio** identifiers | ✅ | `PORTFOLIO_ID` → `/^PF_[A-Z0-9][A-Z0-9_]{1,30}$/` |
| **research** identifiers | ✅ | `RESEARCH_ID` → `/^RSRCH_[A-Z0-9][A-Z0-9_-]{0,38}$/` |
| **event** identifiers | ✅ | `EVENT_ID` → `/^EVT_[A-Z0-9]{2,14}_[0-9]{8}_[0-9]{2,4}$/` |
| **instrument** identifiers | ✅ | `ISIN` → `/^[A-Z]{2}[A-Z0-9]{9}[0-9]$/`; `EXCHANGE_SYMBOL` → `/^[A-Z][A-Z0-9]{1,19}$/`; `COMPOSITE_TICKER` → `/^(NSE\|BSE):([A-Z][A-Z0-9]{1,19}\|[0-9]{6})$/` |
| **cross-provider mapping semantics** | ✅ | `crossProviderMappingSemantics.normativeReference = 'src/identity/mapping_store.ts'`; `identifierTypeTaxonomy = [ISIN, CIN, NSE_SYMBOL, BSE_SYMBOL, COMPOSITE_TICKER]`; point-in-time effective-dated resolution to `COMPANY_ID`; fail-closed `IdentityAmbiguityError` with `UNMAPPED_IDENTIFIER` / `AMBIGUOUS_COLLISION` quarantine; `reimplemented: false` |

All five authorized identifier families and the cross-provider mapping semantics are **defined**.
**PASS.**

### C2 — Deliverable: "Canonical ID specification" → **PASS**

| Check | Result |
|---|---|
| Artifact exists at candidate commit | ✅ `src/contracts/canonical_id_specification.ts` — blob `b2254c6dd7f00f6da07886b0af33ad4a6b3d5429`, **9,834 bytes**, **committed** at `e716bf1f` |
| It **is** the canonical ID specification | ✅ self-declares `CANONICAL_ID_SPECIFICATION_ID = 'P01-01-CANONICAL-ID-SPECIFICATION'` and `CANONICAL_ID_SPECIFICATION_VERSION = '1.0.0'`; exposes them deterministically via `canonicalIdSpecificationDescriptor()` |
| Corresponding specification deliverable | ✅ `docs/P01-01-CANONICAL-ID-SPECIFICATION.md` — blob `720d4892…`, 6,279 bytes, committed; matching Specification ID/Version; quotes the authorized Requirement and Deliverable verbatim |

**PASS.**

### C3 — Test / Validation: "Contract tests" → **PASS**

| Check | Result |
|---|---|
| Artifact | `tests/p01_01_canonical_identifiers.contract.test.ts` — blob `e126f859a000d0cfd7ee671af88dabc843a9b004`, **11,271 bytes**, **committed** at `e716bf1f` |
| Committed, not local/untracked | ✅ verified via GitHub contents API and the `e716bf1f` commit diff (`added`) |
| Suite identity | ✅ `describe('P01-01 Canonical Identifier Specification — contract tests')`, `node:test` / `node:assert`, offline |
| T01–T14 present | ✅ all fourteen: T01 T02 T03 T04 T05 T06 T07 T08 T09 T10 T11 T12 T13 T14; **14 `it()` blocks** |
| Reported results | Run 1 **11/14** (3 executor-side defects) → Run 2 **12/14** (2 further defects) → Run 3 **14/14 PASS**; determinism re-run **14/14 PASS (identical)**; `tsc` exit 0; certified coexistence `wsa_p01_contracts.test.ts` **7/7 PASS** (recorded in the execution record §6–§7, honest run history preserved) |
| **Independent re-verification at this gate** | See §4 — the fixture/grammar correspondence was **re-derived from the committed module source**, not taken on trust |

**PASS.**

### C4 — Evidence: "ID contract + fixtures" → **PASS**

| Check | Result |
|---|---|
| ID contract | ✅ `src/contracts/canonical_id_specification.ts` — committed, blob `b2254c6d…` |
| Fixtures | ✅ `tests/fixtures/p01_01_canonical_id_fixtures.json` — blob `dd71fb6eb964d8e435d236f12a47eb8b9a78a268`, **4,926 bytes**, **committed** at `e716bf1f` |
| **Association with the P01-01 candidate** | ✅ fixtures pin `specificationId = 'P01-01-CANONICAL-ID-SPECIFICATION'` and `specificationVersion = '1.0.0'` — matching the module constants; fixture `provenance.authorization` records `P01-WAVE1-EXECUTION-AUTHORITY-DESIGNATION-ACT.md @ 6b7552b`; the test suite reads the fixture file at line 33 and **T01 asserts** `FIXTURES.specificationVersion === CANONICAL_ID_SPECIFICATION_VERSION` |
| Fixture content | valid/invalid maps for all 7 kinds (30 valid / 35 invalid), 7 `missingValueKinds`, 4 `normalizationCases`, `reuseAnchors`, 5 `legacyEvidence` entries, provenance block |

**PASS.**

### C5 — Exit Criteria: "IDs versioned and testable" → **PASS**

**Versioned:**
- Single version of record: `CANONICAL_ID_SPECIFICATION_ID = 'P01-01-CANONICAL-ID-SPECIFICATION'`,
  `CANONICAL_ID_SPECIFICATION_VERSION = '1.0.0'` (MAJOR.MINOR.PATCH).
- **Fixture-pinned**: `FIXTURES.specificationVersion === '1.0.0'` and
  `FIXTURES.specificationId === 'P01-01-CANONICAL-ID-SPECIFICATION'` — asserted by **T01**.
- **Deterministic exposure**: `canonicalIdSpecificationDescriptor()` returns a frozen descriptor
  whose `version` equals the constant — asserted by **T02**.
- **Versioning policy** stated in the specification deliverable §5: any grammar/kind/normalization/
  mapping change requires a MAJOR.MINOR.PATCH bump and a new governed specification record.

**Testable:**
- 14 committed contract tests covering all 7 kinds (T03–T05 strict validation), normalization seam
  (T06), fail-closed parse (T07), determinism (T08), certified-layer retention and legacy boundary
  (T09), cross-provider/PIT/quarantine/ambiguity reuse semantics (T10–T13), and non-duplication of
  mapping implementations (T14).
- **Independently re-derived** at this gate (§4): 30 valid fixtures accepted and 35 invalid fixtures
  rejected by the grammars read directly from the committed module source.

**PASS.**

### C6 — Entry Criteria: "Baseline reconciled" (dependency `P00-02`, Hard) → **PASS**

| Check | Result |
|---|---|
| P00-02 acceptance act | `P00-02-BASELINE-RECONCILIATION-ACCEPTANCE-ACT.md` — blob `0f1d0e5297117d504fff8664759a3b5e91253be5`, **12,453 bytes**, present at commit `2d3c9718b80b6c92d9e333733604e83fc261ac2e` on the candidate lineage |
| Explicit disposition | **"P00-02 ACCEPTED / EXIT CONDITION = SATISFIED / BASELINE AND GAPS = RECORDED"** |
| Bearing on P01-01 | §11, verbatim: *"P01-01/P01-02's entry criterion ("Baseline reconciled") is now supported by an accepted P00-02 act"* |
| Hard dependency | **SATISFIED** |

**PASS.**

---

## 4. INDEPENDENT RE-DERIVATION (not taken on trust)

To avoid making the result PASS merely because tests are reported to pass, the fixture/grammar
correspondence was **re-derived at this gate** by extracting the seven grammars **directly from the
committed module source at `e716bf1f`** and re-testing every fixture value against them:

| Re-derived check | Result |
|---|---|
| Grammars extracted from committed module source | **7 / 7** |
| **T03** — 30 valid fixtures accepted by the module grammars | **PASS** |
| **T04** — 35 invalid fixtures rejected by the module grammars | **PASS** |
| **T05** — `missingValueKinds` declared for all 7 kinds (7/7) | **PASS** |
| **T06** — 4 normalization cases (normalized valid, raw strictly invalid) | **PASS** |
| **T01** — version constant == fixture pin == `1.0.0` | **PASS** |
| **T02** — deterministic frozen descriptor + limitations + evidence basis recorded | **PASS** |
| **OVERALL** | **ALL PASS** |

**Stated limitation:** `node`/`tsc` were **not executed** at this gate (no `node_modules`; installing
packages is prohibited). The reported 14/14 result therefore rests on the **recorded execution
evidence** corroborated by the **independent re-derivation above** and by the committed-status
verification of every artifact. This limitation is **recorded, not converted into either a PASS or a
FAIL**; it is not a criterion and does not defeat any of C1–C6.

---

## 5. DEP-P01-07 BOUNDARY — IDENTIFIER-SCOPED PORTION ONLY

The acceptance-criteria authority act determined: **"P01-01 PARTIALLY SATISFIES DEP-P01-07 —
IDENTIFIER-SCOPED PORTION ONLY."**

| Recognized for P01-01 (per the authority act) | Status at this gate |
|---|---|
| `tests/p01_01_canonical_identifiers.contract.test.ts` | ✅ committed, verified, T01–T14 |
| T01–T14 | ✅ present and independently re-derived |
| `tests/fixtures/p01_01_canonical_id_fixtures.json` | ✅ committed, verified, associated |

**Confirmed NOT pulled into this determination** (each verified absent from the candidate lineage):

| Outstanding element | Verified |
|---|---|
| P01-02 time contract tests | **ABSENT** from candidate — not used |
| P01-04 mode contract tests | **ABSENT** — not used |
| P01-05 provenance contract tests | **ABSENT** — not used |
| P01-03 golden measurement fixtures | **ABSENT** — not used |
| Byte-identity re-demonstration (blocked on M-1) | **ABSENT** — not used |

**DEP-P01-07 is NOT declared globally satisfied.** The historical DEP-P01-07 record remains intact.
Only the **P01-01 identifier-scoped disposition** is determined here.

---

## 6. IMPLEMENTATION-PROHIBITION BOUNDARY

The authority act resolved this question and it is **not reopened**. Recorded and confirmed:

- The P01 standing implementation prohibition **remains generally in force**; `D4_12_PHASE_SEQUENCE.md`
  is **not revisited or rewritten**.
- The P01-WAVE1 execution-authority decision re-scoped the bounded execution scope to include
  **P01-01 and P01-02** (holder decision **option C**, §5), with §9 naming **P01-01 — Canonical
  identifiers** explicitly.
- The P01-01 artifacts were therefore verified to fall **within** the explicitly authorized execution
  scope — `src/contracts/canonical_id_specification.ts`, `tests/p01_01_canonical_identifiers.contract.test.ts`,
  `tests/fixtures/p01_01_canonical_id_fixtures.json`, `docs/P01-01-CANONICAL-ID-SPECIFICATION.md`.
- **The existence of the artifacts was not treated as an independent authority basis.**
- The execution scope was **not expanded** to other P01 work.

---

## 7. PRESERVATION AND NON-REGRESSION EVIDENCE (material to the determination)

| Check | Result |
|---|---|
| Candidate purely additive across `main..e716bf1f` | **25 files added; 0 modified; 0 deleted** |
| All 13 certified contract modules byte-identical to `main` (git blob SHA-1) | **IDENTICAL ×13** |
| B1/IRR P01-01 Canonical Envelope (`envelope.ts`, blob `88f4efd0…`) | **UNMODIFIED** — different capability, label collision controlled |
| D115 canonical identity allocator | **ABSENT** from candidate lineage |
| `docs/p01/` documentation package | **ABSENT** from candidate lineage; **not** used as acceptance evidence for the executable module |
| ISIN grammar identical to certified D05 contract | `d05_security_master.ts:51` == `canonical_id_specification.ts:66` — **IDENTICAL** |
| Normalization identical to certified mapping store | `mapping_store.ts:46` == `normalizeCanonicalIdValue` — **IDENTICAL** |
| No second mapping implementation | test imports certified classes directly; `reimplemented: false` — **CONFIRMED** |
| Certified coexistence suite unaffected | `wsa_p01_contracts.test.ts` **7/7 PASS** |

---

## 8. EXPLICIT RE-EXERCISE DISPOSITION

> ## **P01-01 ACCEPTANCE RE-EXERCISE PASSED**
>
> **ALL SIX AUTHORIZED CRITERIA C1–C6 = PASS**
>
> | Criterion | Result |
> |---|---|
> | C1 Requirement | **PASS** |
> | C2 Deliverable | **PASS** |
> | C3 Test / Validation | **PASS** |
> | C4 Evidence | **PASS** |
> | C5 Exit Criteria | **PASS** |
> | C6 Entry Criteria | **PASS** |
>
> Disposition basis: §1–§7 of this record, on the P01-01 candidate committed at
> `e716bf1f4bb1c32199f57f43de54f0b67daa6b72`, adjudicated against the criteria authorized by the
> acceptance-criteria authority act @ `7eec2d197ab6b967c153edd5151b4e37abe0f806`.

**This result was not manufactured from:** the implementation's existence · tests appearing to pass ·
the prior acceptance's PASS · the tracker's PASS · the authority act's authorization of the criteria.
The authority act established **what must be demonstrated**; this gate **independently verified whether
it is demonstrated** (§3, §4, §7).

---

## 9. RELATIONSHIP TO THE ORIGINAL ACCEPTANCE ACT

The original acceptance act @ `9c9e606d` reached **ACCEPTED** on criteria that were, at the time,
**not authoritatively based**. This re-exercise reaches the **same substantive conclusion** on
criteria that are **now authoritatively based** by the acceptance-criteria authority act @ `7eec2d1`.

- The original act is **preserved as the historical record** and is **not** rewritten, amended,
  revoked, replaced, or back-dated.
- This record is a **separate governed artifact**. Two records, two commits, two checkpoints.
- **The original acceptance is not declared invalid.** The re-exercise does not fail; it succeeds on
  the authorized basis.

---

## 10. DOWNSTREAM BOUNDARY (explicit — this record does NOT authorize)

This record authorizes **NONE** of:

- **certification** of P01-01, or any certification activity;
- **certification-authority designation** (a separately governed determination);
- certification evidence or release qualification;
- **integration** of the candidate into PMD `main` (no merge, cherry-pick, rebase, or copy);
- modification of D05 Security Master, `src/identity`, `src/d114`,
  `frontend/src/features/portfolio`, `src/ui`, or any frozen tree;
- modification of the canonical envelope/validation engine or identifiers already used by PMD;
- persistence, UI, provider-integration, or OIDC changes;
- **production activation**;
- **Dhan / NSE / live-market-data** access;
- **credential** authorization;
- P01-02, P01-03, P01-04, P01-05, P02–P17, INT-011, Watchlists, SG-4/SG-5, or D115 work;
- any tracker status mutation;
- discharging the outstanding portions of DEP-P01-07.

---

## 11. A3 BOUNDARY

The designated A3 acceptor is **SAI** (designation act @ `4dda3edd`). This re-exercise was exercised
by that acceptor against the authorized criteria.

> **Certification-authority designation is NOT performed in this record.**
> **No certification activity is performed.**

---

## 12. REPOSITORY INTEGRITY VERIFICATION

| Check | Result |
|---|---|
| PMD `main` | `4d3e1cdca3a33da0ec3be8b336b17128108a502c` — **MATCH / UNCHANGED** ✓ |
| Candidate `arena/01a0e30c` tip | `e716bf1f4bb1c32199f57f43de54f0b67daa6b72` — **MATCH / UNCHANGED** ✓ |
| Acceptance act @ `9c9e606d` | blob `5f355db6…` — **UNMODIFIED** ✓ |
| Acceptance-criteria authority act @ `7eec2d1` | blob `69871fa6…` — **UNMODIFIED** ✓ |
| A3 designation act @ `4dda3edd` | blob `5af8eee3…` — **UNMODIFIED** ✓ |
| Execution-authority act @ `6b7552b` | **UNMODIFIED** (candidate lineage) ✓ |
| P00-02 acceptance act @ `2d3c9718` | blob `0f1d0e52…` — **UNMODIFIED** ✓ |
| `docs/p01/` package, `D4_12`, P01-01 source/tests/fixtures | **UNMODIFIED** ✓ |
| Frozen `src/identity` (D05) | `9080e997ee7da977d0066431737e329e88b3c0b7` — **UNCHANGED** ✓ |
| Frozen `src/d114` | `0062ad520dce647f3d02ed9a27739598d457faaa` — **UNCHANGED** ✓ |
| Frozen `frontend/src/features/portfolio` | `8491efdc44ae449eedf1aaf93fbc7415c428fcb9` — **UNCHANGED** ✓ |
| Frozen `src/ui` | `1597ed0663ee6a450dac7e9c6959748a1a85b05e` — **UNCHANGED** ✓ |
| Candidate integrated into `main` | **0 files** — not integrated ✓ |
| Unauthorized diff count | **0** ✓ |

---

## 13. SINGLE-ARTIFACT ATTESTATION

This is the **only artifact created by this re-exercise record**. No source, test, fixture,
governance act, tracker, configuration, UI, API, or integration artifact was created, modified,
renamed, deleted, or regenerated in this pass.

---

## 14. NEXT SINGLE GOVERNED STEP (named; NOT performed)

> ## `P01-01 CERTIFICATION-AUTHORITY DETERMINATION / DESIGNATION`

Certification authority for P01-01 is **NOT designated**. A separate, explicitly governed
certification-authority determination/designation act is required before any certification act, and
remains subject to all remaining prerequisites. Certification is **not** performed, implied, or
pre-judged by this re-exercise. Integration into PMD `main` may be considered only after the
appropriate acceptance **and** certification gates.

---

**Adjudication attestation:** Adjudicated and recorded by SAI, the designated A3 acceptor for P01-01,
against the criteria authorized by the acceptance-criteria authority act @ `7eec2d1`. Candidate
identity and immutability independently verified at `e716bf1f`; artifacts verified **committed**, not
local. Criteria correspondence **independently re-derived** from the committed module source. DEP-P01-07
confined to its identifier-scoped portion; outstanding portions not pulled in. Implementation-prohibition
disposition recorded, not reopened. The original acceptance act preserved as historical record. No
certification, certification authority, integration, or production authority granted.
