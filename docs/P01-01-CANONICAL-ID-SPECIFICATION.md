# P01-01 — Canonical Identifier Specification

- **Specification ID:** `P01-01-CANONICAL-ID-SPECIFICATION`
- **Specification Version:** `1.0.0` (MAJOR.MINOR.PATCH; fixture-pinned; bumping the version requires a new fixture pin)
- **Program item:** P01-01 (Work Tracker) — *Canonical identifiers*
- **Requirement (verbatim):** "Define instrument/company/portfolio/research/event identifiers and cross-provider mapping semantics."
- **Deliverable fulfilled (tracker):** "Canonical ID specification"
- **Authority:** `evidence/target-shell-integration/P01-WAVE1-EXECUTION-AUTHORITY-DESIGNATION-ACT.md` (commit `6b7552b642b92c0b783d4c190e409c4ce116e932`; holder RAMKI; executor Arena)
- **Execution Mode:** NON_PRODUCTION / LOCAL_FIXTURE_AND_OFFLINE_DEV (offline fixtures only; no network, no production credentials)
- **Executable contract:** `src/contracts/canonical_id_specification.ts` (version constant + grammars + validators + descriptor)
- **Fixtures:** `tests/fixtures/p01_01_canonical_id_fixtures.json`
- **Contract tests:** `tests/p01_01_canonical_identifiers.contract.test.ts`
- **Status of this gate:** execution evidence only — **P01-01 ACCEPTANCE NOT PERFORMED; P01-01 CERTIFICATION NOT PERFORMED** (acceptance authority unresolved per the authority act).

---

## 1. Scope

Defines **instrument** identifiers (ISIN, exchange symbol, composite ticker), **company** identifiers, and the NEW **portfolio**, **research**, and **event** identifier grammars, plus the **cross-provider mapping semantics** (referenced, not reimplemented, from the certified identity layer). Nothing outside P01-01 (no P01-02 time semantics, no P02+, no providers, no ingestion).

## 2. Identifier kinds and grammars

| Kind | Grammar | Evidence basis |
| --- | --- | --- |
| `COMPANY_ID` | `^EQ_[A-Z0-9]{3,20}_IN$` | Governed fixture master + broad-universe dataset convention `EQ_<BASE>_IN` (observed base length 3–8; bound chosen conservatively) |
| `PORTFOLIO_ID` | `^PF_[A-Z0-9][A-Z0-9_]{1,30}$` | **NEW program definition** (no certified-baseline precedent); legacy forms recorded, not repaired |
| `RESEARCH_ID` | `^RSRCH_[A-Z0-9][A-Z0-9_-]{0,38}$` | **NEW program definition** (no baseline precedent) |
| `EVENT_ID` | `^EVT_[A-Z0-9]{2,14}_[0-9]{8}_[0-9]{2,4}$` | **NEW**, modeled on recorded D06 fixture news-id shape `NEWS-INFY-20260918-01` |
| `ISIN` | `^[A-Z]{2}[A-Z0-9]{9}[0-9]$` | Identical to `src/contracts/d05_security_master.ts` (structural only; no check digit) |
| `EXCHANGE_SYMBOL` | `^[A-Z][A-Z0-9]{1,19}$` | Governed symbols observed in certified identity layer |
| `COMPOSITE_TICKER` | `^(NSE|BSE):([A-Z][A-Z0-9]{1,19}|[0-9]{6})$` | `src/identity/security_master.ts` mapping construction (`NSE:<SYMBOL>` / `BSE:<SYMBOL>` / `BSE:<SCRIPCODE>`); observed governed scrip codes are 6-digit (conservative bound) |

- Validation is **strict** on canonical values: no implicit normalization, no fuzzy matching (fail-closed).
- Missing values → `MISSING_MANDATORY_FIELD`; malformed values → `STRUCTURAL_MALFORMATION` (error-code vocabulary reused from `src/contracts/types.ts`).

## 3. Normalization seam

`normalizeCanonicalIdValue(value)` = `value.trim().toUpperCase()` — identical semantics to the certified `src/identity/mapping_store.ts` resolution normalization. Normalization is an **explicit deterministic pre-step**, never implicit.

## 4. Cross-provider mapping semantics (normative reference — not reimplemented)

Provider/identifier taxonomy and resolution behavior are inherited from the certified identity layer `src/identity/mapping_store.ts`:

- identifier types: `ISIN | CIN | NSE_SYMBOL | BSE_SYMBOL | COMPOSITE_TICKER`;
- resolution: point-in-time effective-dated (`effectiveFrom`/`effectiveTo`) to the canonical `COMPANY_ID`;
- failure mode: **fail-closed** — `IdentityAmbiguityError` with quarantine record (`UNMAPPED_IDENTIFIER` / `AMBIGUOUS_COLLISION` / …) recorded into the quarantine sink; unmapped identifiers are never fabricated or fuzzy-mapped.

`src/contracts/canonical_id_specification.ts` declares these semantics (`crossProviderMappingSemantics.normativeReference`) and defines the canonical value grammars the taxonomy resolves to. It implements no second mapping store.

## 5. Versioning policy

- `CANONICAL_ID_SPECIFICATION_VERSION` (module constant) is the single version of record; the fixture set pins it (`specificationVersion` field) and the contract tests assert agreement.
- Any change to a grammar, kind set, normalization operation, or mapping semantic requires a version bump per MAJOR.MINOR.PATCH semantics and a new governed specification record.

## 6. Recorded limitations (explicit; not silently decided)

1. Legacy opaque `companyId` values exist in certified-era fixtures (`d05_fixtures.json`: `INFY`, `TCS`; `d06_fixtures.json`: `INFY`). They are recorded, non-conformant to the canonical `COMPANY_ID` grammar, and **NOT repaired**; the D05 contract validator remains authoritative for those payloads as opaque non-empty strings.
2. Legacy `portfolioId` forms `DEFAULT`/`DEFAULT_PORTFOLIO` (BI-07 test suites) are recorded as non-conformant legacy evidence; no mapping is invented.
3. Legacy event-style id `NEWS-INFY-20260918-01` is recorded; the canonical `EVENT_ID` grammar is NEW; no automatic rewrite is defined.
4. Real-world exchange symbols containing `&`, `-` or similar characters are excluded from the offline `EXCHANGE_SYMBOL` grammar by design; such cases fail closed (consistent with certified identity governance).
5. ISIN validation is structural only — same limitation as the D05 contract (ISO-6166 check digit not verified).
6. `PORTFOLIO_ID`, `RESEARCH_ID`, `EVENT_ID` grammars are NEW program definitions with no certified-baseline precedent; designated under P01-01 scope only.
7. `COMPANY_ID` grammar range is bounded from governed evidence (observed base length 3–8) and may be widened only by a later governed specification version.

## 7. Exit-condition tracking

- Tracker exit condition (verbatim): **"IDs versioned and testable"** — demonstrated by T01/T02 (versioned descriptor + fixture pin) and T03–T14 (testable: strict validation, normalization, determinism, fail-closed reuse semantics). Assessed in the execution record only; no acceptance claim is made here.
