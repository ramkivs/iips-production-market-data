# IIPS v3.0 — IPD Provenance & Eligibility Authority Decision Request

> **NON-OPERATIVE DECISION REQUEST.** This record prepares one question for the Program
> Authority. It renders **no decision**, grants **no implementation authority**, selects
> **no schema, field, property, enum or type name**, and changes no D05 semantics, corpus
> content, resolver behaviour or governance artifact. Nothing here may be treated as
> approval of any repair.

| Field | Value |
|---|---|
| **Record type** | Decision request (unanswered question for the Program Authority) |
| **Record identifier** | `IIPS-V3-IPD-PROVENANCE-ELIGIBILITY-DECISION-REQUEST-2026-10-19-01` |
| **Decision-maker required** | **Ramki — Program Authority**, acting as the IPD security-contract / qualification authority for `ramkivs/iips-production-market-data` — the capacity identified in `evidence/np04/IIPS_v3.0_G2_IPD_GATE_A_PRIME_WINDOWS_STORE_PROVISIONING_AUTHORITY_REQUEST_2026-10-17.md` §Decision-maker required, `evidence/np04/IIPS_v3.0_G2_IPD_GATE_C_BUILD_PREREQUISITE_ACCEPTANCE_REQUEST_2026-10-17.md` §Decision-maker required, and `evidence/np04/IIPS_v3.0_D4_BROKER_PREVIEW_OWNER_ACCEPTANCE_RECORD_2026-10-18.md` (Program Authority = owner = sole user) |
| **Existing work items touched** | `CV-22` (IRR) and internal gap identifiers `IPA-05`, `IPA-06`, `IPA-07`, `IPA-09`, `IPA-10`, `IPA-11`, `IPA-12`. **No new `CV-` identifier is created.** `IPA-*` are assessment-local labels from the 2026-10-19 IPD identity/eligibility assessment, not authoritative work items |
| **IPD evidence baseline** | `main@e9b42f63a5a8955e6317127f0248b99f37153e18` |
| **Prepared** | `2026-10-19` (Asia/Kolkata) |
| **Status** | **DECISION REQUIRED — not answered in this record** |

---

## 1. The question

> **What provenance and eligibility semantics is IPD authorized to assert from its governed
> D05 corpus, and what evidence is required for each assertion?**

This single question gates four distinct repairs and any future consumer roster. It is
asked of the Program Authority and is **not** answered below. This record supplies only the
evidence, the enumerated choices, and the consequences of leaving each unresolved.

It is the IPD-side form of prerequisite 1 in the IRR decision record
`docs/integration/IIPS_v3.0_CV22_OPTION_C_PA_DECISION_2026-10-19.md` §3.1 (*"Authoritative
identity and eligibility contract … Do not derive eligibility from a display label or
resolver classification"*), which remains **DEFERRED** under Option C.

---

## 2. Verified source evidence

All evidence below was reproduced at `main@e9b42f63a5a8955e6317127f0248b99f37153e18`.

### 2.1 The resolver asserts classification and quality as literals

`src/transports/object_resolver.ts` — `ObjectResolverService.resolveObject`:

| Line | Code | Effect |
|---|---|---|
| 53 | `sourceClassification: 'REAL',` | literal, also fed to the lineage digest |
| 59 | `sourceClassification: 'REAL',` | literal, emitted in `ExecutiveProvenance` |
| 62 | `dataVersion: 'v1.0.0-sec-master',` | static string; **not** bound to corpus revision/checksum |
| 64 | `quality: 'GOOD',` | literal |
| 65 | `replayConstraintApplied: false,` | literal; no AD-17 constraint text |

Reproduced: resolving the modelled Tier-2 filler record `IT0001` returns
`sourceClassification: REAL`, `quality: GOOD`, `dataVersion: v1.0.0-sec-master`. Resolving
`RELIANCE` returns the **identical** three values. The claim is invariant — it carries no
information about the record resolved.

### 2.2 The corpus cannot supply a classification

The 16 keys of every D05 corpus row are: `bseScripCode, bseSymbol, cin, companyId,
companyName, currency, effectiveFrom, faceValue, industry, isin, listingStatus, listings,
lotSize, nseSymbol, sector, tickSize`. **No field carries an eligibility, origin,
real/synthetic, vendor-tier, source or quality value.** Any classification emitted is
therefore *asserted by code*, not *derived from governed data*.

Corpus composition (2,250 records): indices 0–51 are externally-named Indian issuers;
indices 52–2249 (2,198 records, 97.7%) follow the modelled Tier-2 filler pattern
(`IT0001 India Limited` / `INE0001B0102` / `L10001DL1971PLC100001`). This split is
documented in `BLOCK-3L-BROKER-CSV-FULL-RESOLUTION-AUDIT.md` and is **source-reported, not
independently verified issuer truth**
(`evidence/cross-repository/IIPS_V3_IPD_IRR_PORTFOLIO_AND_CONSUMER_READINESS_RECONCILIATION_2026-10-18.md` §25).
All 2,250 ISINs satisfy the contract regex **and** the ISO 6166 check digit, so identifier
well-formedness is not a discriminator.

### 2.3 IPD's own standard calls this a false attestation

`evidence/target-shell-integration/PHASE2-EVIDENCE-PAYLOAD-FORENSIC-REPORT.md` §10.3:

> *"`sourceClassification` values (`CANONICAL_MARKET_DATA`, `REAL`, `CERTIFIED_ENGINE`) are
> governed attestations; asserting one over invented data is a false attestation."*

The literal `REAL` is emitted over the 2,198 modelled records. Under IPD's own governing
standard this is a false attestation, and it is rendered to the user:
`frontend/src/features/security-master/SecurityMasterSurface.tsx:246` displays
`Source Classification` from `resolution.vm.provenance.sourceClassification`.

### 2.4 Absent descriptor attributes are silently defaulted

`src/transports/object_resolver.ts:68-72`:

```ts
const faceValue = typeof entity.faceValue === 'number' && Number.isFinite(entity.faceValue) && entity.faceValue > 0
  ? entity.faceValue : 1;
const currency: 'INR' | 'USD' = entity.currency === 'USD' ? 'USD' : 'INR';
```

Reproduced: a registration with no `faceValue` and no `currency` resolves to
`faceValue: 1`, `currency: 'INR'`, `quality: 'GOOD'`, `sourceClassification: 'REAL'` — with
no anomaly code, no quality downgrade and no warning. A supplied `faceValue` of `0` is
likewise collapsed to `1`, losing the absent/explicitly-zero distinction. A populated
`currency: 'USD'` **is** projected faithfully, proving the substitution engages only on
absence. `SecurityMaster.registerEntity` performs no validation and does not reject such a
registration.

### 2.5 `asOf` governs identifier mapping only, not the descriptor

`ObjectResolverService.resolveObject` resolves `companyId` with `asOf`
(`object_resolver.ts:43`) and then calls `securityMaster.getEntity(companyId)`
(`object_resolver.ts:44`), an **asOf-independent** map lookup (`security_master.ts:114`).

Reproduced: `NSE_SYMBOL:UTIBANK @ 2005-01-01` resolves to `EQ_AXISBANK_IN` (identifier
history works) but returns **today's** `AXISBANK` listings, byte-identical to an
`AXISBANK` query with no `asOf`. `provenance.asOf` echoes `2005-01-01`, so the payload
gives a consumer no way to detect that the descriptor is not asOf-scoped.

These are two separate concepts and only the first is implemented:

| Concept | Status |
|---|---|
| Effective-dated **identifier** resolution | Implemented, tested, approved (P04-BOOTSTRAP-03, QUAL-08) |
| Historical **descriptor** validity | Not implemented; current snapshot returned for any `asOf` |

The F-3 authority act (`PHASE-F3-UI08-SECURITY-MASTER-FUNCTIONAL-AUTHORITY-ACT.md` §2)
requires "the full resolution descriptor" but is **silent on descriptor temporal validity**.
No descriptor-versioning requirement is therefore asserted or implied by this record.

### 2.6 AIIL: manifest ruling vs. observed data

| Source | Statement |
|---|---|
| `evidence/operator_drop/d05_security_master_manifest.json` | `aiilRuling: "RULING_3_DUAL_EFFECTIVE_DATED_MAPPING"` |
| `evidence/operator_drop/d05_browser_runtime_hydration_report.md` §2.5 | "AIIL dual **effective-dated** BSE scrip codes (`543989` current + `539177` historical)" |
| Corpus record `EQ_AIIL_IN` | three listings (NSE `AIIL`; BSE `AIIL`/`543989`; BSE `AIIL`/`539177`), `effectiveFrom` `2015-01-01`, **no `effectiveTo`** |

Reproduced: both `BSE:543989` and `BSE:539177` resolve to `EQ_AIIL_IN` at `2016-01-01`,
`2020-06-01` and `2026-10-19` alike — the mapping is a **concurrent duplicate**, not an
effective-dated one. Corpus-wide: **no** record carries an `effectiveTo`, and **all**
records share the single `effectiveFrom` `2015-01-01T00:00:00.000Z`.

This record does **not** assert which scrip code is current, does **not** assert that
either ought to be inactive at any date, and does **not** decide whether the corpus or the
manifest wording is wrong.

### 2.7 Characterization coverage published with this request

`tests/d05_identity_eligibility_characterization.test.ts` (new, test-only) pins the observed
behaviour of all four conditions: `CHAR-A-01/02` (classification literals and their
rendering), `CHAR-B-01/02/03` (descriptor fallback), `CHAR-C-01/02` (identifier vs.
descriptor temporality), `CHAR-D-01` (manifest vs. data). Every assertion is marked either
`[OBSERVED DEFECT — UNRESOLVED]`, `[OBSERVED INCONSISTENCY — UNRESOLVED]`,
`[OBSERVED — CONTROL]` or `[APPROVED INVARIANT]`. **A passing characterization test records
present behaviour; it does not repair the defect and does not constitute acceptance.**

---

## 3. The choices the authority must resolve

Seven choices are required. Each is stated as a question; **none is answered here.**

### C1 — May IPD assert that a record is real-market, synthetic, or of unknown eligibility?

Today IPD asserts `REAL` for every record and carries no field that could distinguish. The
authority must decide whether IPD may publish a record-origin classification at all, and
whether "unknown" is a permitted, first-class state.
*Consequence of leaving unresolved:* the false attestation in §2.3 continues, and the UI08
surface continues to display it.

### C2 — What authoritative evidence supports each classification?

The corpus composition is source-reported; the ISIN check digit is not a discriminator;
no D05 field carries provenance. The authority must name what evidence would be sufficient
(external issuer registry, exchange listing evidence, owner attestation, entitlement
record) and who may supply it.
*Consequence:* without a named evidence standard, any classification IPD emits is
unsupported by definition.

### C3 — Are provenance, record quality, and consumer eligibility separate concepts?

Provenance is "where this record came from and which revision was resolved". Quality is
"how complete/current the descriptor is". Eligibility is "whether this consumer may use
this record for this purpose". The authority must state whether one value may be reused as
another.
*Consequence:* if a single value may double as an eligibility flag, the `REAL` literal
becomes — silently — an eligibility claim across every future consumer.

### C4 — What may the system assert when the available evidence is insufficient?

Absent attributes are currently defaulted (§2.4). The authority must decide between
reject, quarantine, surface-as-unknown, or continue defaulting — and, if defaulting is
retained, what quality state and what user-visible condition must accompany it.
*Consequence:* unsupported and legacy registrations will otherwise keep receiving default
financial attributes with `GOOD` quality and no signal.

### C5 — May synthetic or incompletely classified records be displayed, and under what explicitly governed conditions?

The corpus is 97.7% modelled filler and the UI08 surface displays it with no qualifying
statement. The authority must decide whether display is permitted, and if so what
disclosure, labelling or operating-mode constraint must be attached.
*Consequence:* IPD cannot tell whether the current UI08 rendering is acceptable, a
disclosure defect, or a display prohibition.

### C6 — Do the same classification semantics apply universally, or do they depend on the consuming capability?

The same record can be eligible for one consumer boundary and ineligible for another. The
authority must decide whether IPD publishes one producer-scoped assertion ("what this
corpus is") and leaves consumer-scoped admission ("who may use it") to each consumer — or
attempts a universal classification.
*Consequence:* this determines whether IPD's answer is reusable infrastructure (as
contemplated by `IIPS_V3_G2_IPD_IRR_PORTFOLIO_CONSUMER_CONTRACT_V1_2026-10-18.md`) or
per-consumer bespoke logic.

### C7 — What evidence and acceptance criteria are required before any real-only consumer subset may be approved?

Separate from, and in addition to, C1–C6. This is the gate the IRR `CV-22` record already
sets out (§3.1–3.5: identity/eligibility contract, approved roster bound to an exact corpus
revision and checksum, exact IRR identity mapping, explicit consumer acceptance criteria,
repository-specific implementation authority).
*Consequence:* until answered, no real-only subset — and no consumer probe — may be
treated as authorized.

---

## 4. Implementation work that remains BLOCKED pending this decision

| Blocked work | Blocked by | Why |
|---|---|---|
| Repair of the hard-coded `sourceClassification` / `quality` / `dataVersion` / `replayConstraintApplied` in `ObjectResolverService` | C1, C2, C3, C5 | The repair is a change to a governed attestation; the replacement values cannot be chosen without the semantics. ~20 existing assertions currently expect `REAL` |
| Any change to the `faceValue` / `currency` fallback policy | C4 | Whether to reject, quarantine, surface unknown, or keep defaulting is the decision itself |
| Any change to how synthetic or unclassified records are displayed on UI08 | C5 | Whether display is permitted at all is the decision |
| Any historical-descriptor (asOf-scoped descriptor) capability | C1, and a separate scope decision | The F-3 act does not define descriptor temporal validity; adding it is new capability |
| Reconciliation of `aiilRuling` vs. corpus effective dates (corpus change **or** manifest/report wording change) | C1, plus governed-data authority | Either direction alters governed deposition lineage |
| Any eligibility discriminator, roster, or real-only subset | C1, C2, C6, C7 | No semantics exist to populate it |
| Any IRR consumer mapping or the `CV-22-D05-REAL-EQUITY-IDENTITY-PROBE` | IRR `CV-22` Option C (still DEFERRED) + C7 | Cross-repository work is outside this request and remains deferred |

**Expressly NOT blocked** (already completed under existing authority): baseline CI
verification; the test-only characterization suite; this decision request; and all existing
approved behaviour of the D05 corpus, resolver and UI08 surface.

---

## 5. Boundaries observed by this request

* No schema, field, property, enum or type name is proposed, selected or frozen. The
  vocabulary above ("record-origin classification", "eligibility state") is **descriptive
  prose only**, used to pose the question.
* No D05 schema semantics, corpus record, manifest value, resolver behaviour or
  configuration was changed to accommodate any possible answer.
* IRR was not modified. IRR `main@ad008e45e64f15e895043bd2c554a7c93a4c2dc1` was inspected
  read-only; `CV-22` remains **DEFERRED** under Option C and IRR's 13-row sector-reference
  behaviour is unchanged.
* No API, endpoint, service, database, consumer integration or deployment change is
  proposed.
* No Windows, browser, hosted-service or production acceptance is claimed. Validation
  executed in this workstream is Linux sandbox execution plus GitHub-hosted CI.

---

## 6. What the authority is asked to produce

A dated decision record on IPD `main` that:

1. answers C1–C7, or records an explicit deferral for each;
2. states the evidence standard for each permitted assertion;
3. states whether the semantics are producer-scoped, consumer-scoped, or both;
4. names, if any repair is authorized, the exact baseline SHA, permitted file set, tests,
   scope limits and acceptance evidence for a **separate** implementation act.

This request grants nothing in the interim.
