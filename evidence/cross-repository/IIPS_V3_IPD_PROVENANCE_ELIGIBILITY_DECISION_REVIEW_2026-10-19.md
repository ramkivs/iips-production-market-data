# IIPS v3.0 — IPD Provenance & Eligibility Decision Review (C1–C7)

> **NON-OPERATIVE DECISION REVIEW — NOT A DECISION.** This record is a **decision-preparation review** of the published provenance and eligibility authority decision request identified below. It renders **no Program Authority decision**, grants **no implementation authority**, selects **no schema, field, property, enum or type name**, changes **no D05 semantics, corpus content, resolver behaviour, manifest, configuration, or governance artifact**, modifies **no IRR record**, and does **not** authorize any production repair. Nothing here may be treated as approval of any repair, qualification, admission, or production readiness. The existing eight characterization tests remain **observations of unresolved behaviour — not an implicit acceptance contract.**

| Field | Value |
|---|---|
| **Record type** | Decision review (evidence synthesis + recommendations; decision preparation only) |
| **Record identifier** | `IIPS-V3-IPD-PROVENANCE-ELIGIBILITY-DECISION-REVIEW-2026-10-19-01` |
| **Reviewed decision request** | `evidence/cross-repository/IIPS_V3_IPD_PROVENANCE_ELIGIBILITY_AUTHORITY_DECISION_REQUEST_2026-10-19.md` — Record `IIPS-V3-IPD-PROVENANCE-ELIGIBILITY-DECISION-REQUEST-2026-10-19-01` |
| **Reviewed decision request PR** | IPD PR #26 — `test(d05): characterize identity/eligibility integrity gaps; add PA decision request` — merged `2026-10-19T16:45:49Z` as `02a5803145cf215083caf80f54ba1ac458e1682c` |
| **Authoritative remote state verified** | `origin/main` at `02a5803145cf215083caf80f54ba1ac458e1682c` — **matches reported baseline.** Branch `arena/e912ce0e-iips-production-market-data` at same commit; `git fetch origin main` 2026-10-19 returned no divergence. Local HEAD == origin/main == reported merge commit. |
| **Evidence baseline cited by request** | `main@e9b42f63a5a8955e6317127f0248b99f37153e18` — not resolvable as a local Git object; treated as an internal evidence-baseline label. Verified that the operative commit at review time is the PR #26 merge commit `02a5803`, which contains the complete published decision request, characterization tests, and governed D05 data inspected here. |
| **Decision-maker required for C1–C7** | **Ramki — Program Authority**, as identified in `IIPS-V3-CV20-OPTION-A-OWNERSHIP-SOURCE-DESIGNATION-2026-10-18` and `IIPS_v3.0_G2_IPD_GATE_A_PRIME_WINDOWS_STORE_PROVISIONING_AUTHORITY_REQUEST_2026-10-17` §Decision-maker required, `IIPS_v3.0_G2_IPD_GATE_C_BUILD_PREREQUISITE_ACCEPTANCE_REQUEST_2026-10-17` §Decision-maker required, `IIPS_v3.0_D4_BROKER_PREVIEW_OWNER_ACCEPTANCE_RECORD_2026-10-18` (owner = sole user) |
| **Review date** | `2026-10-19` (Asia/Kolkata) |
| **Status** | **REVIEW COMPLETE — DECISION STILL REQUIRED (C1–C7 unanswered). No operative decision created.** |
| **Work items touched** | `CV-22` (IRR — still **DEFERRED** under Option C); internal assessment labels `IPA-05`, `IPA-06`, `IPA-07`, `IPA-09`, `IPA-10`, `IPA-11`, `IPA-12` (not authoritative work items). No new `CV-` identifier created. |

---

## 0. How this review was produced and what it does not do

### 0.1 Verification performed

This review reproduced the evidence cited in the decision request against the **verified current** `origin/main` (`02a5803`):

1. Retrieved the complete decision request from `origin/main:evidence/cross-repository/IIPS_V3_IPD_PROVENANCE_ELIGIBILITY_AUTHORITY_DECISION_REQUEST_2026-10-19.md` (268 lines, SHA verified byte-identical to working-tree copy) and extracted C1–C7 verbatim (see §1).
2. Inspected `src/transports/object_resolver.ts` (lines 43–72) — confirmed hard-coded `sourceClassification: 'REAL'`, `quality: 'GOOD'`, `dataVersion: 'v1.0.0-sec-master'`, `replayConstraintApplied: false`, and `faceValue`/`currency` fallback logic — byte-identical to request §2.1/§2.4 characterization.
3. Inspected `src/identity/security_master.ts` (lines 43–114) — confirmed `resolveCompanyId` is asOf-aware via `IdentityMappingStore`, while `getEntity` is a plain `Map.get` with no asOf parameter.
4. Inspected `src/contracts/d05_security_master.ts` — confirmed `InstrumentMasterPayload` defines `faceValue: number` and `currency: 'INR' | 'USD'` (required fields) with `effectiveFrom`/`effectiveTo?`, but `validateInstrumentMaster` validates only `companyId`, `isin` format, identity symbols, `lotSize`, and `tickSize` — **no validation of `faceValue` or `currency`**.
5. Inspected `src/identity/d05_broad_universe_data.ts` (2,250 records) and sampled `evidence/operator_drop/d05_security_master_manifest.json` — confirmed all records carry `effectiveFrom: "2015-01-01T00:00:00.000Z"` and none carry `effectiveTo`. Inspected `EQ_AIIL_IN` (index 20) — confirmed three listings, dual BSE scrip codes `543989` + `539177`, single `effectiveFrom`, no `effectiveTo`.
6. Inspected `src/identity/governed_fixture_master.ts` — confirmed `GOVERNED_OFFLINE_REFERENCE_ENTITIES` (5 entities) with early effective dates (`2000-01-01`, `1981-07-02`, etc.) vs. `D05_BROAD_UNIVERSE_ENTITIES` (2,250) with uniform `2015-01-01`; confirmed injected `UTIBANK -> EQ_AXISBANK_IN` effective-dated mapping (`1998-01-01` to `2007-07-29T23:59:59.999Z`) at lines 102–108 / 125–131, and `AGI GREENPAC -> EQ_AGI_IN` alias.
7. Inspected `src/identity/mapping_store.ts` (lines 34–47) — confirmed effective-date window logic: `asOf >= effectiveFrom && asOf <= effectiveTo` (or `Infinity` if no `effectiveTo`).
8. Inspected `frontend/src/features/security-master/SecurityMasterSurface.tsx` line 246 and `src/ui/view_models/ui08_security_master_modal.ts` — confirmed UI08 renders `Source Classification` from `resolution.vm.provenance.sourceClassification` / `resolution.provenance.sourceClassification`.
9. Inspected `evidence/target-shell-integration/PHASE-F3-UI08-SECURITY-MASTER-FUNCTIONAL-AUTHORITY-ACT.md` (§2) and `PHASE2-EVIDENCE-PAYLOAD-FORENSIC-REPORT.md` §10.3.
10. Built (`npx tsc`, 0 errors) and ran full test suite (`node scripts/run-tests.mjs`) — **565 tests, 88 suites, 565 passed, 0 failed**. Verified `tests/d05_identity_eligibility_characterization.test.ts` (8 characterization tests: `CHAR-A-01/02`, `CHAR-B-01/02/03`, `CHAR-C-01/02`, `CHAR-D-01`) all pass as observations — not acceptance.

### 0.2 What remains decision preparation only

Per the decision request §5 and §6, and per this review's mandate:

- **No production source, test, D05 data, schema, manifest, or configuration was modified.**
- **No recommendation is recorded as an operative decision.** Recommendations are advisory to the Program Authority only.
- **No implementation authority is created or implied.** All blocked work in request §4 remains blocked pending explicit PA decision + separate implementation authority.
- **IRR was inspected read-only.** `CV-22` remains **DEFERRED** under Option C; IRR's 13-row sector-reference behaviour is unchanged.
- **No API, endpoint, service, database, or consumer integration is introduced.**

---

## 1. Retrieved decision request — C1–C7 verbatim

> Single gating question (§1): *"What provenance and eligibility semantics is IPD authorized to assert from its governed D05 corpus, and what evidence is required for each assertion?"* — the IPD-side form of prerequisite 1 in `docs/integration/IIPS_v3.0_CV22_OPTION_C_PA_DECISION_2026-10-19.md` §3.1, which remains **DEFERRED** under Option C.

The seven choices below are reproduced **verbatim** from `IIPS_V3_IPD_PROVENANCE_ELIGIBILITY_AUTHORITY_DECISION_REQUEST_2026-10-19.md` §3, preserving original order, meaning, and stated consequences of leaving unresolved. No abbreviated completion-report description is substituted.

### C1 — May IPD assert that a record is real-market, synthetic, or of unknown eligibility?

> Today IPD asserts `REAL` for every record and carries no field that could distinguish. The authority must decide whether IPD may publish a record-origin classification at all, and whether "unknown" is a permitted, first-class state. *Consequence of leaving unresolved:* the false attestation in §2.3 continues, and the UI08 surface continues to display it.

### C2 — What authoritative evidence supports each classification?

> The corpus composition is source-reported; the ISIN check digit is not a discriminator; no D05 field carries provenance. The authority must name what evidence would be sufficient (external issuer registry, exchange listing evidence, owner attestation, entitlement record) and who may supply it. *Consequence:* without a named evidence standard, any classification IPD emits is unsupported by definition.

### C3 — Are provenance, record quality, and consumer eligibility separate concepts?

> Provenance is "where this record came from and which revision was resolved". Quality is "how complete/current the descriptor is". Eligibility is "whether this consumer may use this record for this purpose". The authority must state whether one value may be reused as another. *Consequence:* if a single value may double as an eligibility flag, the `REAL` literal becomes — silently — an eligibility claim across every future consumer.

### C4 — What may the system assert when the available evidence is insufficient?

> Absent attributes are currently defaulted (§2.4). The authority must decide between reject, quarantine, surface-as-unknown, or continue defaulting — and, if defaulting is retained, what quality state and what user-visible condition must accompany it. *Consequence:* unsupported and legacy registrations will otherwise keep receiving default financial attributes with `GOOD` quality and no signal.

### C5 — May synthetic or incompletely classified records be displayed, and under what explicitly governed conditions?

> The corpus is 97.7% modelled filler and the UI08 surface displays it with no qualifying statement. The authority must decide whether display is permitted, and if so what disclosure, labelling or operating-mode constraint must be attached. *Consequence:* IPD cannot tell whether the current UI08 rendering is acceptable, a disclosure defect, or a display prohibition.

### C6 — Do the same classification semantics apply universally, or do they depend on the consuming capability?

> The same record can be eligible for one consumer boundary and ineligible for another. The authority must decide whether IPD publishes one producer-scoped assertion ("what this corpus is") and leaves consumer-scoped admission ("who may use it") to each consumer — or attempts a universal classification. *Consequence:* this determines whether IPD's answer is reusable infrastructure (as contemplated by `IIPS_V3_G2_IPD_IRR_PORTFOLIO_CONSUMER_CONTRACT_V1_2026-10-18.md`) or per-consumer bespoke logic.

### C7 — What evidence and acceptance criteria are required before any real-only consumer subset may be approved?

> Separate from, and in addition to, C1–C6. This is the gate the IRR `CV-22` record already sets out (§3.1–3.5: identity/eligibility contract, approved roster bound to an exact corpus revision and checksum, exact IRR identity mapping, explicit consumer acceptance criteria, repository-specific implementation authority). *Consequence:* until answered, no real-only subset — and no consumer probe — may be treated as authorized.

---

## 2. Evaluation of the four confirmed integrity findings

### Finding A — Provenance and classification (resolver emits hard-coded REAL/GOOD)

#### 2.A.1 What the evidence supports

**Source provenance:**

- **What the system does:** `ObjectResolverService.resolveObject` (`src/transports/object_resolver.ts:43-64`) performs: (a) `resolveCompanyId(query)` — asOf-aware identity mapping via `IdentityMappingStore`; (b) `getEntity(companyId)` — asOf-unaware map lookup; (c) constructs `lineageDigest` via `computeLineageHash(entity, { sourceClassification: 'REAL', asOf, dataVersion: 'v1.0.0-sec-master' })`; (d) emits `ExecutiveProvenance { sourceClassification: 'REAL', asOf, evaluatedAt, dataVersion: 'v1.0.0-sec-master', lineageDigest, quality: 'GOOD', replayConstraintApplied: false }`. The `sourceClassification`, `quality`, and `dataVersion` values are **string literals** at lines 53, 59, 62, 64 — not derived from any stored field.
- **What the contract guarantees:** `src/transports/types.ts` defines `ExecutiveProvenance` with `sourceClassification: SourceClassification` (`'CANONICAL_MARKET_DATA' | 'REAL' | 'DERIVED' | 'CERTIFIED_ENGINE'`), `quality: QualityState` (`'GOOD' | 'STALE' | 'PARTIAL' | 'UNAVAILABLE'`), `dataVersion: string`, but **no binding** to corpus revision/checksum. `src/contracts/types.ts` defines `QualityState` hierarchy, but `src/contracts/d05_security_master.ts` validation only enforces `companyId`, ISIN regex (`/^[A-Z]{2}[A-Z0-9]{9}[0-9]$/`), symbol presence, `lotSize`/`tickSize` — not provenance.
- **What the evidence establishes:** Corpus row keys are exactly `bseScripCode, bseSymbol, cin, companyId, companyName, currency, effectiveFrom, faceValue, industry, isin, listingStatus, listings, lotSize, nseSymbol, sector, tickSize` (§2.2) — **no field** carries `eligibility`, `origin`, `real/synthetic`, `vendor-tier`, `source`, or `quality`. Verified: `D05_BROAD_UNIVERSE_ENTITIES[52]` (`IT0001`) keys lowercase contain no `/eligib|synthetic|real|classification|vendor|sourc|quality|tier/` match (pinned in `CHAR-A-01`). All 2,250 ISINs satisfy both the contract regex and ISO 6166 check digit — identifier well-formedness is **not a discriminator** between real and modelled records.
- **What remains unknown/unsupported:** The 52 vs. 2,198 split (`BLOCK-3L-BROKER-CSV-FULL-RESOLUTION-AUDIT.md` Executive Summary point 2: indices 0–51 externally-named, 52–2249 modelled Tier-2 filler) is **source-reported, not independently verified issuer truth** (re-affirmed in `IIPS_V3_IPD_IRR_PORTFOLIO_AND_CONSUMER_READINESS_RECONCILIATION_2026-10-18.md` §25). No authoritative issuer registry or exchange listing evidence was inspected in this pass; the review does not supply it.
- **Characterization evidence:** `CHAR-A-01` resolves `IT0001` (`EQ_IT0001_IN`) and `RELIANCE` (`EQ_RELIANCE_IN`) and asserts both return identical `REAL`/`GOOD`; `CHAR-A-02` SSR-renders `/security-master?type=NSE_SYMBOL&value=IT0001` and asserts `Source Classification` + `REAL` appear. Both **pass** — pinning present literals, not correctness.
- **Authoritative standard violated:** `PHASE2-EVIDENCE-PAYLOAD-FORENSIC-REPORT.md` §10.3: *"`sourceClassification` values (`CANONICAL_MARKET_DATA`, `REAL`, `CERTIFIED_ENGINE`) are governed attestations; asserting one over invented data is a false attestation."* The literal `REAL` over 2,198 modelled records is therefore a **false attestation** under IPD's own standard, rendered to the user at `SecurityMasterSurface.tsx:246`.

**Four concepts — not interchangeable:**

| Concept | Definition in evidence | Current system claim | Authoritative source | Status |
|---|---|---|---|---|
| **Source provenance** | "Where this record came from and which revision was resolved" (C3 definition) | `REAL` + `v1.0.0-sec-master` (literals, no revision binding) | `ExecutiveProvenance` `sourceClassification`/`dataVersion`/`lineageDigest` | **Unsupported** — not bound to corpus revision/checksum; `dataVersion` static (§2.1 line 62) |
| **Real/synthetic classification** | Whether record represents externally-listed instrument vs. modelled filler | `REAL` for all 2,250 | No D05 field exists to support this | **False attestation** over modelled subset per IPD's own §10.3 standard |
| **Data quality** | "How complete/current the descriptor is" (C3) — includes `GOOD`/`STALE`/`PARTIAL`/`UNAVAILABLE` per `QualityState` | `GOOD` for all | `QualityState` type + `validateInstrumentMaster` (only enforces lotSize/tickSize) | **Overstated** — `GOOD` emitted even when descriptor is incomplete (see Finding B) |
| **Consumer eligibility** | "Whether this consumer may use this record for this purpose" (C3) — consumer-scoped admission | Implicitly `REAL` as eligibility via single literal reused | No eligibility contract exists; `CV-22` deferred | **Undefined** — no roster, no consumer mapping |

Do not treat these as interchangeable: provenance ≠ classification ≠ quality ≠ eligibility. The current implementation conflates all four into a single invariant claim.

#### 2.A.2 Minimum evidence needed for any classification to be defensible

- Authoritative **evidence standard** named by PA (C2): which external source qualifies (e.g., NSE/BSE listing evidence, MCA/issuer registry, owner attestation) and who may supply it.
- **Per-record evidence binding**: a corpus revision pinned by `fileChecksumSha256` (`7f53540b…74b5`) + an explicit roster or typed field that distinguishes records with evidence from those without. Source-reported labels in an audit markdown are **insufficient** for a governed attestation.
- **Provenance revision binding**: `dataVersion` must be bound to corpus revision/checksum (not `"v1.0.0-sec-master"` static string), so `lineageDigest` is traceable to a specific governed deposition.

Until C1/C2 are answered, the system must **not assert** `REAL`/`GOOD`.

---

### Finding B — Missing descriptors (faceValue/currency silently defaulted)

#### 2.B.1 What the evidence supports

- **What the system does:** `src/transports/object_resolver.ts:68-72`:
  ```ts
  const faceValue = typeof entity.faceValue === 'number' && Number.isFinite(entity.faceValue)
    && entity.faceValue > 0 ? entity.faceValue : 1;
  const currency: 'INR' | 'USD' = entity.currency === 'USD' ? 'USD' : 'INR';
  ```
  A registration with no `faceValue`/`currency` resolves to `faceValue: 1`, `currency: 'INR'`, `quality: 'GOOD'`, `sourceClassification: 'REAL'` — with **no anomaly code, no quality downgrade, no warning**. `SecurityMaster.registerEntity` performs **no validation** and does not reject such registration.

- **What the contract guarantees:** `src/contracts/d05_security_master.ts` `InstrumentMasterPayload` declares `faceValue: number` and `currency: 'INR' | 'USD'` as **required** fields. However, `validateInstrumentMaster` checks only `companyId`, ISIN regex, symbol presence, `lotSize`, `tickSize`. **It does not validate `faceValue` or `currency` at all** — so a payload missing those fields would not be flagged `MISSING_MANDATORY_FIELD` through that function. The governed corpus (`d05_broad_universe_data.ts`) **does** carry `faceValue` and `currency` for all 2,250 records (sampled: `RELIANCE` faceValue 10, `TCS` 1, `AIIL` 1, all `INR`) — so the current governed corpus does not exercise the fallback. But the **resolver contract is silent** on absent-value handling, and `SecurityMasterEntity` (`security_master.ts:23-26`) declares `faceValue?` and `currency?` as **optional** (`faceValue?: number`, `currency?: string`), explicitly permitting registrations without them.

- **What the evidence establishes:** `CHAR-B-01` registers a minimal entity (`NODESC`, `EQ_CHAR_NODESC_IN`) with **no `faceValue`/`currency`** and asserts fallback to `1`/`INR` with `GOOD`/`REAL`; `CHAR-B-02` registers with populated `10`/`USD` and asserts faithful passthrough — proving fallback engages **only on absence**; `CHAR-B-03` registers `faceValue: 0` and asserts collapse to `1` — proving the absent/explicitly-zero distinction is **lost**. All three pass. The UI08 authority act (`PHASE-F3-UI08-SECURITY-MASTER-FUNCTIONAL-AUTHORITY-ACT.md` §2) requires "full resolution descriptor (ISIN/CIN/listings/sector/industry/face value/currency)" but is **silent on absent-attribute handling** — it neither authorizes silent defaulting nor mandates rejection/anomaly.

- **What remains unknown/unsupported:** Whether absent `faceValue`/`currency` must be rejected, quarantined, surfaced as unknown, or defaulted is **undecided** (C4). Whether `0` is a valid face value vs. an absent signal is undecided. What quality state must accompany a default is undecided. No existing UI08 authority resolves this.

- **Loss distinction:** `faceValue: 0` collapsing to `1` means a caller cannot distinguish "issuer declared face value is 0" (if such existed) from "source had no face value" — a semantic erasure. The broader pattern is: `Number.isFinite && > 0` treats `0`, `null`, `undefined`, `NaN`, negative as identically absent.

Do not choose a replacement policy without authority: the current default is **not** validated by the D05 contract; the D05 contract **requires** `faceValue`/`currency` but does not define fallback; `SecurityMasterEntity` **permits** omission; UI08 is **silent**. Any change (reject/quarantine/unknown/default+disclosure) requires PA decision via C4.

#### 2.B.2 Minimum evidence needed for a defensible descriptor policy

- PA decision on C4: one of **Reject** (refuse registration), **Quarantine** (register but refuse resolution), **Surface-as-unknown** (e.g., absent sentinel), or **Default with explicit condition** (permitted only with named quality downgrade + user-visible signal).
- If default retained: exact **quality state** (e.g., `PARTIAL` or `UNAVAILABLE`, not `GOOD`) and **UI condition** text, bound to `src/contracts/types.ts` `QualityState` hierarchy.
- Contract amendment pinning validation: either tighten `SecurityMasterEntity` to require `faceValue`/`currency` (and reject absent) or define governing descriptor-completeness rules.

---

### Finding C — Historical descriptors (asOf governs identity, not descriptor)

#### 2.C.1 What the evidence supports

- **What the system does:** `ObjectResolverService.resolveObject` (`object_resolver.ts:43-44`):
  ```ts
  const companyId = this.securityMaster.resolveCompanyId(query); // asOf-aware
  const entity = this.securityMaster.getEntity(companyId);       // asOf-unaware
  ```
  `resolveCompanyId` delegates to `IdentityMappingStore.resolveCompanyId` (`mapping_store.ts:34-50`) which filters `EffectiveDatedMapping`s on `asOf` vs. `effectiveFrom`/`effectiveTo`. `getEntity` is `Map.get(companyId)` (`security_master.ts:114`) — a **single snapshot** per companyId, no version history.

- **What the contract guarantees (already-supported):** Effective-dated **identifier resolution** is implemented, tested, approved. `CHAR-C-01` (`[APPROVED INVARIANT]`) pins: `NSE_SYMBOL:UTIBANK @ 2005-01-01T00:00:00.000Z → EQ_AXISBANK_IN`, and `UTIBANK @ 2026-10-19 → IdentityAmbiguityError(UNMAPPED_IDENTIFIER)`. This relies on the governed alias mapping in `governed_fixture_master.ts:102-108` (`UTIBANK` effective `1998-01-01` to `2007-07-29T23:59:59.999Z` → `EQ_AXISBANK_IN`). Approved by `tests/p04_governed_offline_security_master.test.ts` `P04-BOOTSTRAP-03` and `tests/p04_expanded_broad_universe_runtime_qualification.test.ts` `QUAL-08`.

- **What the contract does NOT guarantee (unimplemented):** Historical **descriptor validity** — whether the returned `companyName`, `listings`, `faceValue`, `sector`, etc. are correct *as of* the requested date. `CHAR-C-02` (`[OBSERVED DEFECT — UNRESOLVED]`) pins: `NSE_SYMBOL:UTIBANK @ 2005-01-01` resolves to `EQ_AXISBANK_IN` (correct identity) but returns **byte-identical** `listings` to a current `AXISBANK` query (post-rename symbol `AXISBANK`, not `UTIBANK`-era data), with `provenance.asOf` echoing `2005-01-01` — so a consumer **cannot detect** from the payload that the descriptor is not asOf-scoped.

- **Authoritative gap:** `PHASE-F3-UI08-SECURITY-MASTER-FUNCTIONAL-AUTHORITY-ACT.md` §2 requires "the full resolution descriptor" but is **silent on descriptor temporal validity** — no descriptor-versioning requirement is asserted or implied. The request §2.5 explicitly notes: *"No descriptor-versioning requirement is therefore asserted or implied by this record."*

- **Corpus context:** All 2,250 D05 records share a single `effectiveFrom: "2015-01-01T00:00:00.000Z"` and carry **no `effectiveTo`** (verified by `CHAR-D-01` corpus-wide assertion: zero records with `effectiveTo`, single distinct `effectiveFrom`). There is therefore **no historical descriptor data** to serve even if `getEntity` were made asOf-aware. The UTIBANK test succeeds only because the alias mechanism (a separate `EffectiveDatedMapping`) is distinct from the entity-descriptor model.

**Distinguish already-supported from unimplemented:**

| Concept | Implemented | Tested / Approved | Authority |
|---|---|---|---|
| Effective-dated **identifier** resolution (`UTIBANK@2005 → EQ_AXISBANK_IN`) | Yes — `MappingStore` asOf window | `CHAR-C-01` (`APPROVED INVARIANT`), `P04-BOOTSTRAP-03`, `QUAL-08` | Existing |
| Historical **descriptor** validity (`UTIBANK@2005` returns 2005-era `listings`/`name`) | **No** — `getEntity` is current snapshot | `CHAR-C-02` (`OBSERVED DEFECT`) | **None** — F-3 act silent |

Do not assume the existing identity contract authorizes descriptor history: F-3 does not define it, and the corpus contains no temporal descriptor versioning.

#### 2.C.2 Minimum evidence needed for historical descriptor capability

If PA ever elects to add descriptor history (a **new capability**, not a repair of a regression):
- PA scope decision: is historical descriptor validity in-scope at all?
- Governed **descriptor-versioning model** (e.g., per-company effective-dated snapshots vs. journal) — schema, field set, and which fields are versioned.
- Corpus data to populate it (today: single effectiveFrom, no effectiveTo, no version rows).
- Acceptance tests binding `asOf` to distinct descriptor assertions (negative cases included).

Until then, the system must **not claim** historical descriptor correctness when only identity mapping is time-aware.

---

### Finding D — AIIL mapping (manifest RULING_3 vs. observed corpus and mapping)

#### 2.D.1 What the evidence supports

**Exact mismatch — three sources diverging:**

| Source | Statement | Evidence |
|---|---|---|
| **Governed manifest** | `evidence/operator_drop/d05_security_master_manifest.json` line 10: `"aiilRuling": "RULING_3_DUAL_EFFECTIVE_DATED_MAPPING"` | Manifest batch `BATCH-D05-TIER2-BROAD-UNIVERSE-2026-09-22-001`, `authorizationRef: AUTH-D05-BROAD-UNIVERSE-MASTER-EXPANSION-ACT-2026-09-22-001`, `recordCount: 2250`, `fileChecksumSha256: 7f53540b…74b5` |
| **Human-readable report** | `evidence/operator_drop/d05_browser_runtime_hydration_report.md` §2.5: "AIIL dual **effective-dated** BSE scrip codes (`543989` current + `539177` historical)" | Report §2 forensic defect resolution; describes AIIL as effective-dated |
| **Corpus record** | `EQ_AIIL_IN` (`d05_broad_universe_data.ts` ~line 320-360): `companyId: EQ_AIIL_IN`, `isin: INE206F01022`, `effectiveFrom: "2015-01-01T00:00:00.000Z"`, **no `effectiveTo`**, three listings: `NSE AIIL`, `BSE AIIL/543989`, `BSE AIIL/539177` | Corpus is governed deposition under same authorization act |

**Observed behaviour:**

- `CHAR-D-01` (`[OBSERVED INCONSISTENCY — UNRESOLVED]`) asserts manifest `aiilRuling == RULING_3_DUAL_EFFECTIVE_DATED_MAPPING`, corpus `EQ_AIIL_IN` carries no `effectiveTo`, has 2 BSE listings (`539177`, `543989`), and **both** `BSE:543989` and `BSE:539177` resolve to `EQ_AIIL_IN` at **all three probed dates** (`2016-01-01`, `2020-06-01`, `2026-10-19`) — the mapping is a **concurrent duplicate**, not an effective-dated succession.
- Corpus-wide: **zero** records carry `effectiveTo`; **all** share `2015-01-01T00:00:00.000Z` (`CHAR-D-01` asserts `effectiveTo !== undefined` count == 0, distinct `effectiveFrom` set == single value).

**Consequence:** The manifest ruling word `DUAL_EFFECTIVE_DATED_MAPPING` promises temporal distinction; the corpus delivers **none** (single effectiveFrom, no effectiveTo, concurrent listings); the resolver therefore delivers **concurrent** resolution. The report's "543989 current + 539177 historical" is **unsupported by corpus effective dates**. This is a three-way mismatch (manifest wording vs. corpus data vs. observable output) — not merely a missing index.

**What remains unknown/unsupported:**

- Which scrip code is current vs. historical — **undecided and unknowable from corpus** (corpus provides no dates to answer).
- Whether the corpus should be corrected (add effectiveTo/effectiveFrom per scrip) or the manifest/report wording should be corrected (describe as concurrent dual mapping, not effective-dated) — **both are governed-data changes** requiring PA + deposition authority.
- Whether any consumer relies on the effective-dated interpretation — not inspected.

Do not independently decide which BSE scrip is current, alter effective dates, or treat the manifest wording as proof of the intended mapping. Either direction changes governed deposition lineage (request §4 blocked work table, row "Reconciliation of aiilRuling vs. corpus effective dates").

#### 2.D.2 Minimum evidence needed to reconcile

- PA decision reconciling manifest vs. corpus: **corpus effective-date correction** (new governed deposition with distinct effective windows + new manifest/checksum) OR **manifest/report wording correction** (re-describe as concurrent, non-temporal dual listing and accept concurrent mapping as intended).
- If corpus correction: external **BSE listing-history evidence** for AIIL scrip succession dates, and new deposition `fileChecksumSha256` binding.
- Acceptance: `CHAR-D-01` updated to assert new effective-date behaviour (or new concurrent-mapping intent) and pass with distinct temporal assertions proving the chosen direction.

---

## 3. Decision matrix with recommendations (C1–C7)

Each entry provides: Exact question (verbatim), Evidence, Options (materially distinct, defensible), Recommended disposition, Rationale, Risks/consequences, Dependencies, Implementation authority, Verification criteria.

---

### C1 — May IPD assert that a record is real-market, synthetic, or of unknown eligibility?

| Field | Content |
|---|---|
| **Exact question** | Today IPD asserts `REAL` for every record and carries no field that could distinguish. The authority must decide whether IPD may publish a record-origin classification at all, and whether "unknown" is a permitted, first-class state. *Consequence of leaving unresolved:* the false attestation in §2.3 continues, and the UI08 surface continues to display it. |
| **Evidence** | `src/transports/object_resolver.ts:53,59,62,64` — literals `REAL`/`GOOD`/`v1.0.0-sec-master`/`false`; `src/transports/types.ts` `SourceClassification` enum; `src/contracts/d05_security_master.ts` — no provenance field; `src/identity/d05_broad_universe_data.ts` — 2,250 records, 16 keys each, none of which is a classification (`CHAR-A-01` corpus-key search proves no matching field); `BLOCK-3L-BROKER-CSV-FULL-RESOLUTION-AUDIT.md` Executive Summary: indices 0–51 externally-named, 52–2249 modelled Tier-2 filler (2,198; 97.7%) — **source-reported only** (`IIPS_V3_IPD_IRR_PORTFOLIO_AND_CONSUMER_READINESS_RECONCILIATION_2026-10-18.md` §25); `PHASE2-EVIDENCE-PAYLOAD-FORENSIC-REPORT.md` §10.3: `REAL` over invented data = false attestation; `frontend/src/features/security-master/SecurityMasterSurface.tsx:246` renders `Source Classification` from resolver; `tests/d05_identity_eligibility_characterization.test.ts` `CHAR-A-01`/`CHAR-A-02` pin invariant `REAL`/`GOOD` and rendering |
| **Options** | **O-C1a — Prohibit classification assertion until evidence exists:** IPD must emit no real/synthetic/unknown classification. Resolver must not emit `REAL`/`GOOD` as factual classification. <br>**O-C1b — Permit producer assertion with mandatory unknown:** IPD may emit a producer-scoped `recordOrigin` only when per-record evidence supports it; otherwise must emit `UNKNOWN` (or `UNCLASSIFIED`) as a first-class state. `REAL` prohibited without evidence. <br>**O-C1c — Authorize current assertion:** IPD may continue emitting `REAL` for all 2,250 records as authoritative. |
| **Recommended disposition** | **O-C1a (immediate) → O-C1b (target after evidence):** Immediately prohibit `REAL` as an authoritative claim for all records. In the interim, emit `UNKNOWN`/`UNCLASSIFIED` (or suppress classification) rather than `REAL`. Only transition to per-record `REAL` vs. `SYNTHETIC` vs. `UNKNOWN` after C2 evidence standard + corpus binding is satisfied. Expressly reject O-C1c. |
| **Rationale** | The system currently has **zero** per-record provenance evidence (no D05 field; `dataVersion` static; literal claim). Under IPD's own §10.3 standard, continuing `REAL` over 97.7% modelled records is a documented false attestation with regulatory and downstream-consumer impact. The D05 corpus shape (2,250 records, all ISINs well-formed, no discriminator) cannot support a universal `REAL`. "Unknown permitted as first-class state" is the only conservative transition that honestly reflects evidence insufficiency without inventing a schema prematurely (the request §5 notes vocabulary is descriptive prose, not frozen names). O-C1c is indefensible: it ratifies the false attestation with no evidence. |
| **Risks and consequences** | *If O-C1a/O-C1b adopted:* Resolver/UI08 surface must change; ~20 existing assertions expecting `REAL` will fail (request §4 blocked work notes ~20 assertions); new tests must pin `UNKNOWN` behaviour — but false attestation ceases. <br>*If deferred (no decision):* False attestation continues indefinitely; UI08 continues displaying `REAL`; any future consumer (IRR or other) will inherit an eligibility claim via C3 conflation. <br>*If O-C1c adopted (not recommended):* Grants false attestation authority; downstream eligibility (C3/C6/C7) built on it becomes invalid; contradicts §10.3 standard; would require amending that standard with PA justification. |
| **Dependencies** | **None to decide C1** — but C2 must follow immediately to define what evidence would ever permit `REAL`; C3 determines whether classification doubles as eligibility; C5 depends on C1 (display depends on classification); C7 depends on C1+C2 before any real-only subset |
| **Implementation authority** | **No — this review grants none.** C1 choice itself does not authorize implementation. A separately authorized implementation act must name exact baseline SHA, permitted file set (`src/transports/object_resolver.ts`, `src/contracts/types.ts` if new state needed, `frontend/src/features/security-master/SecurityMasterSurface.tsx`, tests), scope limits (no corpus/manifest change in this step), and acceptance evidence. Do not modify production behaviour until that act. |
| **Verification criteria** | (1) `src/transports/object_resolver.ts` no longer emits `REAL`/`GOOD` as factual without evidence — instead emits the PA-chosen sentinel (`UNKNOWN` or equivalent) with tests proving invariant; (2) `CHAR-A-01`/`CHAR-A-02` deliberately updated and passing on new invariant; (3) UI08 surface no longer displays `REAL` for modelled records (or displays chosen disclosure); (4) `frontend/src/features/security-master/SecurityMasterSurface.tsx` rendering verified via SSR test; (5) no new schema name frozen without C1–C3 authority. |

---

### C2 — What authoritative evidence supports each classification?

| Field | Content |
|---|---|
| **Exact question** | The corpus composition is source-reported; the ISIN check digit is not a discriminator; no D05 field carries provenance. The authority must name what evidence would be sufficient (external issuer registry, exchange listing evidence, owner attestation, entitlement record) and who may supply it. *Consequence:* without a named evidence standard, any classification IPD emits is unsupported by definition. |
| **Evidence** | `BLOCK-3L-BROKER-CSV-FULL-RESOLUTION-AUDIT.md` §Executive Summary points 1–2 + `IIPS_V3_IPD_IRR_PORTFOLIO_AND_CONSUMER_READINESS_RECONCILIATION_2026-10-18.md` §25: 52/2198 split source-reported, not independently verified; `src/contracts/d05_security_master.ts`: no provenance field; `src/identity/d05_broad_universe_data.ts`: all 2,250 ISINs pass contract regex + ISO 6166 check digit (so ISIN not a discriminator); `evidence/operator_drop/d05_security_master_manifest.json`: `recordCount: 2250`, `fileChecksumSha256: 7f53540b…74b5`, `authorizationRef: AUTH-D05-BROAD-UNIVERSE-MASTER-EXPANSION-ACT-2026-09-22-001` — authorizes deposition, not classification; `PHASE-F3-UI08-SECURITY-MASTER-FUNCTIONAL-AUTHORITY-ACT.md`: authorizes UI08 surface, not provenance attestation; `evidence/target-shell-integration/PHASE2-EVIDENCE-PAYLOAD-FORENSIC-REPORT.md` §§5–6: strongest governance provenance is over **program certification packages**, not per-company data (join test: zero artifacts carry both `lineageDigest` + `companyId`) |
| **Options** | **O-C2a — External authoritative source required:** Each `REAL` classification must be backed by external, independently verifiable evidence (exchange listing record with effective date, MCA/CIN validation, or owner attestation bound to `isin`+`companyId`+`effectiveFrom`). IPD does not self-certify real-market status. <br>**O-C2b — Governed deposition + audit trail:** Classification is supported by a governed D05 re-deposition under `AUTH-D05-BROAD-UNIVERSE-MASTER-EXPANSION-ACT-2026-09-22-001` (or successor act) with explicit per-record classification field, pinned `fileChecksumSha256`, and PA-approved roster — supplemented by external sample verification. <br>**O-C2c — Owner attestation sufficient:** Owner/PA attestation alone (without external exchange evidence) is sufficient to label records `REAL`. |
| **Recommended disposition** | **O-C2a as principle, implemented via O-C2b deposition mechanism:** Require external, independently verifiable evidence per record for any `REAL` claim; operationalize it as a governed corpus re-deposition with per-record provenance field + explicit PA-approved roster, pinned to `fileChecksumSha256` + `authorizationRef`. Reject O-C2c as sole basis for `REAL`; ISIN check digit explicitly rejected as evidence (request §2.2). |
| **Rationale** | The forensic report proves no current artifact supplies per-company provenance (zero join on `lineageDigest`+`companyId`). Source-reported narrative in audit markdown cannot substitute for exchange/issuer verification — as the reconciliation notes, it is not independently verified issuer truth. `REAL` is a **governed attestation** (FIPS-180-4 lineage standard), so the evidence must be proportionate: external listing evidence + governed deposition binding. O-C2c would re-introduce self-certification with no external check, contradicting the non-invention principle (§10.3). The contract `T-1` already demands external evidence for market-data claims in IPD's own architecture. |
| **Risks and consequences** | *If O-C2a/O-C2b:* Establishes defensible attestation standard; enables C7 real-only subset only after evidence collected — slower but governable. <br>*If deferred:* Any classification remains unsupported by definition (request C2 consequence). <br>*If O-C2c:* Fast but weak — PA attestation without external evidence would not survive external audit; downstream consumers (IRR/BI08) would rely on unverified `REAL` labels. |
| **Dependencies** | Depends on **C1** (whether classification is permitted) — but C2 must be answered together with C1 to make O-C1b achievable. C7 depends on C2 (needs evidence standard before any subset). |
| **Implementation authority** | **No.** Naming the evidence standard does not itself authorize corpus re-deposition. A separate governed-data authority act must authorize any new D05 field, re-deposition, manifest update, or `fileChecksumSha256` rotation — with exact baseline SHA, permitted file set, and evidence pack (external listing evidence, entitlement/attribution where applicable). |
| **Verification criteria** | (1) For each record labelled `REAL`: evidence pack exists containing external listing/issuer source (exchange record, MCA entry) bound to `companyId`+`isin`+`effectiveFrom`; (2) corpus re-deposition `fileChecksumSha256` rotates and is recorded in `d05_security_master_manifest.json` with successor `authorizationRef`; (3) `CHAR-A-01` corpus-key search updated to assert new provenance-field existence; (4) resolver tests pin per-record classification derived from corpus field, not literal; (5) negative cases: modelled records without evidence remain `UNKNOWN`, not `REAL`. |

---

### C3 — Are provenance, record quality, and consumer eligibility separate concepts?

| Field | Content |
|---|---|
| **Exact question** | Provenance is "where this record came from and which revision was resolved". Quality is "how complete/current the descriptor is". Eligibility is "whether this consumer may use this record for this purpose". The authority must state whether one value may be reused as another. *Consequence:* if a single value may double as an eligibility flag, the `REAL` literal becomes — silently — an eligibility claim across every future consumer. |
| **Evidence** | `src/transports/object_resolver.ts:46-64` conflates: `lineageDigest` seeded with `sourceClassification: 'REAL'` + `dataVersion: 'v1.0.0-sec-master'` (provenance), `quality: 'GOOD'` (quality), `replayConstraintApplied: false` (simulation flag), all emitted as single `ExecutiveProvenance`; `src/contracts/types.ts` `QualityState` (`GOOD`/`STALE`/`PARTIAL`/`UNAVAILABLE`) and `SourceClassification` are distinct types but resolver emits both as literals together; `IIPS_V3_G2_IPD_IRR_PORTFOLIO_CONSUMER_CONTRACT_V1_2026-10-18.md` contemplates IPD as producer-scoped infrastructure with consumer-scoped admission; `PHASE2-EVIDENCE-PAYLOAD-FORENSIC-REPORT.md` §10.3: `sourceClassification` values are governed attestations — not interchangeable with quality; `CHAR-B-01` / `CHAR-C-02` show quality/provenance emitted as `GOOD`/`REAL` even when descriptor is incomplete (missing faceValue) or stale (historical asOf returns current descriptor) — proving conflation enables eligibility smuggling |
| **Options** | **O-C3a — Strict separation:** Provenance, quality, and eligibility are three distinct concerns. No value may be reused as another. `sourceClassification`/`quality`/`dataVersion`/`lineageDigest` describe the producer's data; eligibility is a separate, consumer-scoped determination. <br>**O-C3b — Permitted aliasing:** A single field (e.g., `REAL`/`GOOD`) may serve as both provenance and eligibility — one consumer's eligibility is the producer's quality. |
| **Recommended disposition** | **O-C3a — Strict separation** (provenance ≠ quality ≠ eligibility). |
| **Rationale** | The resolver today does exactly what C3 warns against: `REAL` (a provenance attestation) plus `GOOD` (a quality claim) are emitted for every record, and absent any explicit eligibility contract they are already being read as eligibility (UI08 displays `REAL`; any IRR/BI08 consumer would infer "eligible for real trading"). The forensic report and C3 definition explicitly define them as different concepts for good reason: provenance is about data lineage (revision/checksum), quality about descriptor completeness (faceValue/currency present, asOf correct), eligibility about consumer authorization (consumer roster, entitlement). Treating one literal as all three collapses the entire governance model and silently promotes every synthetic record to "eligible for real use" — the exact failure `CV-22` was created to prevent. The G-2 contract contemplates IPD as reusable producer infrastructure (Option C6's "producer-scoped assertion") with per-consumer admission, which requires separation. |
| **Risks and consequences** | *If O-C3a:* Requires resolver to stop reusing `REAL` as eligibility; eligibility must be modelled separately (C6/C7); more work but prevents silent eligibility laundering. <br>*If O-C3b (not recommended):* Simplifies schema (one field) but allows `REAL` literal to become eligibility for all consumers — every future consumer (portfolio, PIT, engine adapters) would inherit synthetic-as-real risk; contradicts G-2 contract's per-consumer design. <br>*If deferred:* The conflation continues; the false attestation (Finding A) silently doubles as eligibility. |
| **Dependencies** | Depends on **C1** (whether classification exists to conflate) and **C2** (evidence backing it). Informs **C6** (scope of eligibility) and **C7** (real-only subset criteria). |
| **Implementation authority** | **No.** Stating separation does not authorize schema changes. A separate implementation act must authorize distinct provenance/quality/eligibility fields (if any), their types/enums, and migration of `ExecutiveProvenance` — currently descriptive prose only (request §5: no field/enum name selected). |
| **Verification criteria** | (1) Resolver no longer derives eligibility from `sourceClassification` or `quality`; (2) `src/transports/types.ts` or successor contract preserves distinct `SourceClassification` vs. `QualityState` vs. eligibility type with no cross-assignment; (3) UI08 `SecurityMasterSurface.tsx` no longer implies eligibility from `Source Classification` row (labelled as provenance, or separated); (4) tests assert provenance, quality, eligibility independently (e.g., absent descriptor → quality downgraded but provenance unchanged); (5) no consumer code gates admission on `sourceClassification == 'REAL'`. |

---

### C4 — What may the system assert when the available evidence is insufficient?

| Field | Content |
|---|---|
| **Exact question** | Absent attributes are currently defaulted (§2.4). The authority must decide between reject, quarantine, surface-as-unknown, or continue defaulting — and, if defaulting is retained, what quality state and what user-visible condition must accompany it. *Consequence:* unsupported and legacy registrations will otherwise keep receiving default financial attributes with `GOOD` quality and no signal. |
| **Evidence** | `src/transports/object_resolver.ts:68-72` — silent fallback `faceValue→1`, `currency→INR`, no anomaly, `quality: GOOD`; `src/identity/security_master.ts:27-46` `registerEntity` — no validation/rejection; `src/contracts/d05_security_master.ts:34-37` `InstrumentMasterPayload.faceValue: number` + `currency: 'INR'|'USD'` required, but `validateInstrumentMaster` does **not** validate them (only `companyId`, `isin`, `symbols`, `lotSize`, `tickSize`); `src/identity/security_master.ts:23-26` `SecurityMasterEntity.faceValue?: number` + `currency?: string` **optional** — permits absent via type; `evidence/target-shell-integration/PHASE-F3-UI08-SECURITY-MASTER-FUNCTIONAL-AUTHORITY-ACT.md` §2 — requires "full resolution descriptor" but **silent** on absent handling; `tests/d05_identity_eligibility_characterization.test.ts` `CHAR-B-01` (absent→1/INR/GOOD), `CHAR-B-02` (populated passthrough), `CHAR-B-03` (0→1 indistinguishability) — all pass, pin silent default |
| **Options** | **O-C4a — Reject:** `registerEntity` or resolver must reject absent/invalid descriptor registrations (throw or quarantine) — no default emitted. <br>**O-C4b — Quarantine:** Register but mark unresolved; resolution quarantines with `UNAVAILABLE` or typed reason, not `GOOD`. <br>**O-C4c — Surface-as-unknown:** Resolver returns explicit `UNKNOWN` sentinel for absent attributes (or omits field) with downgraded quality (e.g., `PARTIAL`) and user-visible disclosure. <br>**O-C4d — Default with explicit condition:** Retain `1`/`INR` default only when accompanied by mandatory quality downgrade (e.g., `PARTIAL`) + anomaly code + user-visible disclosure that value is substituted. <br>**O-C4e — Retain current silent default:** Keep `1`/`INR` with `GOOD` and no signal (status quo). |
| **Recommended disposition** | **O-C4c (preferred) or O-C4d with mandatory disclosure; reject O-C4e.** Specifically: the system must **not** silently represent substituted values as source-confirmed facts. Minimum: emit explicit unknown sentinel or default must carry (i) quality ≠ `GOOD` (recommend `PARTIAL` per `QualityState` hierarchy), (ii) anomaly/`quarantineReason` or `qualityState` downgrade, (iii) UI signal disclosing substitution. `faceValue: 0` must be preserved as distinct from absent (requires policy on whether 0 is valid vs. absent sentinel). |
| **Rationale** | The D05 contract **requires** `faceValue`/`currency`, but `validateInstrumentMaster` never enforces them, and `SecurityMasterEntity` optionally types them — so the contract and entity model contradict, and the resolver silently fills the gap with `1`/`INR` + `GOOD`. This converts missing financial data (legally significant) into a fabricated fact with high quality, exactly the failure the request warns: "unsupported and legacy registrations will otherwise keep receiving default financial attributes with GOOD quality and no signal." Financial attributes (`faceValue`) affect corporate-action ratio calculations, P&L, and valuation — fabricating them is prohibited by `quality_rollup` hierarchy (`GOOD > STALE > PARTIAL > UNAVAILABLE`). The F-3 act's silence neither authorizes nor forbids defaulting, so silent default cannot be treated as approved. O-C4c (unknown sentinel) is cleanest; O-C4d (default+disclosure) preserves backwards compatibility where legacy data must still display, but both require downgrade+signal. O-C4e (current) is indefensible: it asserts `GOOD` over absent data. |
| **Risks and consequences** | *If O-C4c/O-C4d adopted:* Legacy registrations will surface as `PARTIAL`/`UNAVAILABLE` or with disclosure — honest but breaks ~current `GOOD` assumptions; BI08/Portfolio consumers must handle non-`GOOD` quality. <br>*If O-C4a/O-C4b (reject/quarantine):* Strongest integrity — absent descriptors never produce values — but may break broad-universe display until corpus is fully populated (2,250 records currently complete, but ad-hoc `registerEntity` callers would be affected). <br>*If deferred (no decision):* Silent fabrication continues; `faceValue: 0` ↔ absent indistinguishability persists; no anomaly to alert consumer. <br>*If O-C4e retained:* Continues false `GOOD` over fabricated data; violates `QualityState` semantics (`GOOD` means validated). |
| **Dependencies** | Depends on **C1–C3** conceptually (quality vs. provenance vs. eligibility) — but C4 is the narrow descriptor-completeness policy. Informs resolver + UI08 changes. |
| **Implementation authority** | **No.** C4 choice itself does not authorize implementation. A separate act must name exact baseline SHA, permitted files (`src/transports/object_resolver.ts`, `src/identity/security_master.ts`, `src/contracts/d05_security_master.ts`, `src/contracts/types.ts`, UI08 surface), new validation/anomaly codes (if any), and whether schema tightens `faceValue?`/`currency?` to required. |
| **Verification criteria** | (1) Registering entity with no `faceValue`/`currency` yields either rejection, quarantine, `UNKNOWN` sentinel, or default + downgraded `PARTIAL`/`UNAVAILABLE` + user-visible condition — no `GOOD`; (2) `faceValue: 0` preserved distinct from absent (test: `CHAR-B-03` updated to assert distinction); (3) `validateInstrumentMaster` (or successor) enforces `faceValue`/`currency` presence and emits anomaly code; (4) UI08 surface visually distinguishes substituted values (badge, footnote, or quality indicator ≠ `GOOD`); (5) existing `CHAR-B-01/02/03` updated to pin new explicit behaviour. |

---

### C5 — May synthetic or incompletely classified records be displayed, and under what explicitly governed conditions?

| Field | Content |
|---|---|
| **Exact question** | The corpus is 97.7% modelled filler and the UI08 surface displays it with no qualifying statement. The authority must decide whether display is permitted, and if so what disclosure, labelling or operating-mode constraint must be attached. *Consequence:* IPD cannot tell whether the current UI08 rendering is acceptable, a disclosure defect, or a display prohibition. |
| **Evidence** | `BLOCK-3L-BROKER-CSV-FULL-RESOLUTION-AUDIT.md` Executive Summary: 97.7% modelled Tier-2 filler (`IT0001`–`XXX2198`); `src/identity/d05_broad_universe_data.ts`: `IT0001 India Limited` (`INE0001B0102`) through filler pattern confirmed in corpus; `frontend/src/features/security-master/SecurityMasterSurface.tsx:246` + `SecurityMasterSurface.tsx:228-246` renders `Source Classification: REAL` + `Governed value` table for any resolved record, with `CertifiedBadge` + "Governed D05 Broad Universe (2,250 entities)" meta — **no synthetic disclaimer**; `evidence/target-shell-integration/PHASE-F3-UI08-SECURITY-MASTER-FUNCTIONAL-AUTHORITY-ACT.md` §2–§6: authorizes UI08 mount at `/security-master` with preserved behaviours (canonical `EQ_*_IN`, full descriptor, provenance+digest, fail-closed, responsive/accessibility) — **explicitly prohibits** new API/auth/D115/production market-data activation, but **does not address** synthetic display semantics; `PHASE2-EVIDENCE-PAYLOAD-FORENSIC-REPORT.md` §10.3: `REAL` over invented data = false attestation — currently rendered to user; `CHAR-A-02` pins UI08 rendering of `REAL` for `IT0001` |
| **Options** | **O-C5a — Permit display with mandatory disclosure:** Any synthetic/unclassified record may be displayed **only** with explicit, PA-approved labelling (e.g., "Modelled/Synthetic — not a listed instrument" or operating-mode banner `OFFLINE_BOOTSTRAP`/`LOCAL_FIXTURE`) and without `REAL` classification. <br>**O-C5b — Permit display in non-production mode only:** Synthetic records are visible **only** under `NON_PRODUCTION`/`OFFLINE_BOOTSTRAP`/`LOCAL_FIXTURE_AND_OFFLINE_DEV` operating mode (already declared in `governed_fixture_master.ts` header); production/qualification surfaces must hide or refuse them. <br>**O-C5c — Prohibit synthetic display:** UI08 (and any future consumer) must refuse to display synthetic/unclassified records — fail-closed, quarantine, or `NOT_FOUND` (analogous to current `UNMAPPED_IDENTIFIER` for absent instruments like `HCLTECH`). |
| **Recommended disposition** | **O-C5a + O-C5b combined:** Permit display **in current non-production/offline mode only**, with mandatory PA-approved disclosure labelling that distinguishes synthetic/modelled from externally-named records, and suppresses any `REAL` attestation (per C1). Do not permit unlabeled display. O-C5c (full prohibition) would be excessive for current `LOCAL_FIXTURE_AND_OFFLINE_DEV` mode where broad-universe scaffolding is needed for broker-ingress testing; but any future qualification/production/PIT/engine consumer must apply O-C5c-level exclusion for synthetic records. |
| **Rationale** | The governance context is `NON_PRODUCTION / OFFLINE_BOOTSTRAP / BROWSER_AND_NODE_SAFE` (`governed_fixture_master.ts:4-8`, manifest `operatingMode: OFFLINE_BOOTSTRAP`, `selectedTier: TIER_2_ACTIVE_NSE_CM`). Within that boundary, the 2,198 synthetic records exist deliberately as Tier-2 expansion scaffolding for broker-ingress and D05 hydration qualification (evidenced by `PHASE-F3` act authorizing broad-universe binding, `d05_browser_runtime_hydration_report.json` "Browser Hydration" framing). Prohibiting all display would break legitimate non-production testing. But displaying `IT0001 India Limited` as `REAL` with `CertifiedBadge` and "Governed" meta is currently a **disclosure defect** under IPD's own §10.3 standard — the user cannot distinguish real from modelled. The F-3 act authorized a UI08 surface but did not grant authority to misrepresent synthetic data as real; it also explicitly prohibited production market-data activation. The correct non-production posture is: display permitted, but with honest disclosure and without `REAL`. |
| **Risks and consequences** | *If O-C5a+O-C5b:* UI08 remains functional for non-production; user sees honest labelling; synthetic records usable for ingress testing but not mistaken for real holdings; requires `SecurityMasterSurface.tsx` disclosure component + distinct visual treatment. <br>*If O-C5c (full prohibit) now:* Strongest integrity but would hide 97.7% of corpus — breaks current e2e broker tests (`IT0001` paths in `e2e_broad_universe_multi_broker_integration.test.ts`). <br>*If deferred:* Current disclosure defect continues — UI08 "governed" + `REAL` misleads; any future consumer (IRR portfolio, PIT) inheriting UI08 pattern would repeat it. <br>*If display authorized without disclosure:* Expands false attestation from §2.3 to every viewing user; future real-only roster (C7) undermined. |
| **Dependencies** | Depends on **C1** (classification permitted?), **C2** (what distinguishes synthetic), **C3** (eligibility vs. display). C5 display decision must precede any future UI08 repair. |
| **Implementation authority** | **No.** Permitting display with disclosure does not authorize changing `SecurityMasterSurface.tsx` or adding disclosure text. A separate implementation act must authorize any UI disclosure component, label text (PA-approved wording), operating-mode banner, and its tests. No new disclosure wording is selected here. |
| **Verification criteria** | (1) All 52 externally-named vs. 2,198 modelled records are visually distinguishable (label, badge, or operating-mode constraint); (2) No record displays `REAL` without evidence (per C1/C2); (3) `CHAR-A-02` updated to assert disclosure presence/absence (or non-display if O-C5c elected); (4) SSR rendering test proves disclosure text appears for `IT0001` but not misleadingly for `RELIANCE`; (5) Operating mode `OFFLINE_BOOTSTRAP` / `LOCAL_FIXTURE_AND_OFFLINE_DEV` prominently disclosed on surface; (6) Production-mode surface (if ever authorized) hides or quarantines synthetic records. |

---

### C6 — Do the same classification semantics apply universally, or do they depend on the consuming capability?

| Field | Content |
|---|---|
| **Exact question** | The same record can be eligible for one consumer boundary and ineligible for another. The authority must decide whether IPD publishes one producer-scoped assertion ("what this corpus is") and leaves consumer-scoped admission ("who may use it") to each consumer — or attempts a universal classification. *Consequence:* this determines whether IPD's answer is reusable infrastructure (as contemplated by `IIPS_V3_G2_IPD_IRR_PORTFOLIO_CONSUMER_CONTRACT_V1_2026-10-18.md`) or per-consumer bespoke logic. |
| **Evidence** | `IIPS_V3_G2_IPD_IRR_PORTFOLIO_CONSUMER_CONTRACT_V1_2026-10-18.md` — IPD owns portfolio domain/persistence/IPC endpoint; IRR owns consumer adapter/HTTP routes/HTTP status mapping/UI; contract specifies wire boundary without merging taxonomies; `IIPS_V3_IPD_IRR_PORTFOLIO_AND_CONSUMER_READINESS_RECONCILIATION_2026-10-18.md` §4.1–§4.2: IPD D05 (2,250) vs. IRR 13 sector-reference rows; `CV-22-D05-REAL-EQUITY-IDENTITY-PROBE` proposal contemplates consumer-specific identity mapping; `src/engine_adapters/types.ts` `CertifiedSectorEngineId` (13 sectors + CSIP) vs. IRR `EngineRegistry.ts` 13 engines — distinct taxonomies; `src/pit/package.ts` `PitReadService` `securityId = ISIN:<isin>:<series>` (series-qualified) vs. D05 `companyId = EQ_*_IN` — not interchangeable; `CHAR-A-01` finding: same `REAL` literal applied to both `IT0001` (filler) and `RELIANCE` (named) proves universal classification is today's (flawed) model |
| **Options** | **O-C6a — Producer-scoped + consumer-scoped split (recommended):** IPD publishes **one** producer-scoped assertion: "what this corpus is" — i.e., per-record provenance/classification derived from governed corpus revision + evidence standard (C1/C2). Each consumer (IRR portfolio, PIT, engine adapters, future BI08 consumer) then makes its **own** admission decision ("who may use it") via a consumer-specific eligibility contract + roster — e.g., `CV-22`'s real-only subset for IRR, qualified `RELIANCE` mapping, PIT series mapping. IPD does not dictate universal eligibility. <br>**O-C6b — Universal classification:** IPD attempts one classification that is valid for all consumers — e.g., `REAL` means eligible everywhere, `SYNTHETIC` means ineligible everywhere. |
| **Recommended disposition** | **O-C6a — Producer-scoped infrastructure + consumer-scoped admission.** |
| **Rationale** | The evidence strongly favours separation: (1) The G-2 contract already models IPD as **portable infrastructure** (IPD owns portfolio domain/store/IPC; IRR owns consumer adapter/routes) — reusable infrastructure requires producer-scoped semantics, not bespoke per-consumer logic baked into IPD. (2) Taxonomies are already distinct and **must remain so**: D05 `companyId` ≠ PIT `securityId` (series-qualified) ≠ sector engine IDs; forcing a universal `REAL` across all three would require collapsing them. (3) Eligibility varies by consumer even for real records: a record may be eligible for research display (UI08) but ineligible for PIT historical queries (needs series/entitlement) or for engine scoring (needs fundamentals coverage) — one flag cannot capture this. (4) `CV-22` Option C explicitly anticipates a **consumer-bound** real-only roster with exact identity mapping — not a universal corpus mutation. O-C6b would recreate the same conflation C3 prohibits, at the cross-repository level. |
| **Risks and consequences** | *If O-C6a:* Enables reusable IPD answer (C1/C2 provenance) + distinct `CV-22` consumer contract — clean separation; each consumer needs its own implementation authority + qualification (more gates, but correct layering). <br>*If O-C6b:* Forces IPD to decide for all consumers in advance — per-consumer needs (series mapping, entitlement, sector engines) leak into D05; universal `REAL` re-enables eligibility laundering across consumers. <br>*If deferred:* IPD's current universal `REAL` literal continues to be read as universal eligibility — any new consumer inherits false eligibility without its own gate. |
| **Dependencies** | Depends on **C1** (whether classification exists), **C2** (what supports it), **C3** (provenance ≠ eligibility). Must be decided before **C7** (C7's real-only subset is a consumer-scoped admission on top of producer assertion). |
| **Implementation authority** | **No.** Adopting O-C6a does not authorize creating any consumer eligibility contract or roster. Consumer-specific contracts (IRR `CV-22`, PIT series mapping, etc.) each require their own PA decision + separate implementation authority in their owning repository. |
| **Verification criteria** | (1) IPD producer assertion (e.g., per-record provenance field) is consumer-agnostic — does not reference IRR/PIT/engine consumers; (2) At least one consumer-scoped admission contract exists (e.g., IRR `CV-22` roster mapping `EQ_RELIANCE_IN → canonicalSecurityId` with exact revision/hash binding) before that consumer is treated as admitted; (3) Same record can be proven eligible in one consumer (UI08 display with disclosure) and ineligible in another (e.g., PIT pending series mapping) without contradiction; (4) No IPD code gates consumer behaviour on `sourceClassification` alone. |

---

### C7 — What evidence and acceptance criteria are required before any real-only consumer subset may be approved?

| Field | Content |
|---|---|
| **Exact question** | Separate from, and in addition to, C1–C6. This is the gate the IRR `CV-22` record already sets out (§3.1–3.5: identity/eligibility contract, approved roster bound to an exact corpus revision and checksum, exact IRR identity mapping, explicit consumer acceptance criteria, repository-specific implementation authority). *Consequence:* until answered, no real-only subset — and no consumer probe — may be treated as authorized. |
| **Evidence** | `IIPS_V3_IPD_IRR_PORTFOLIO_AND_CONSUMER_READINESS_RECONCILIATION_2026-10-18.md` §4.1–§4.2 + §8 rows 4–5: D05 2,250 vs. IRR 13 sector-reference rows (sector names as `canonicalSecurityId`, not instrument identities); `CV-22-D05-REAL-EQUITY-IDENTITY-PROBE` specified as proposal (RELIANCE candidate) with 5-part evidence pack (D05 revision/hash, exact companyId, authoritative ISIN/series/symbol/effective-date, IRR PIT distinction, entitlement) — **not executed, not authorized**; `IIPS_V3_IPD_ONE_PASS_CONTINUATION_2026-10-18.md` §3–§5: probe readiness = specification only; no approval for real-market acceptance; `IIPS_V3_G3_IMPLEMENTATION_AUTHORITY_REQUEST_2026-10-18.md` §13: `CV-22` remains decision-required; `IRR tracker PKG-04` options A (retain 13)/B (bounded D05 contract)/C (commission real-market coverage) — no option selected (Option B is current tracker **recommendation** per `IIPS_V3_IPD_IRR_PORTFOLIO_AND_CONSUMER_READINESS_RECONCILIATION_2026-10-18.md` §4.1 note "reports B as the current tracker recommendation, while the PA decision remains pending" — recommendation ≠ decision); `d05_security_master_broad_universe.json` SHA `7f53540b…74b5` + manifest `authorizationRef: AUTH-D05-BROAD-UNIVERSE-MASTER-EXPANSION-ACT-2026-09-22-001` — binds corpus revision but not eligibility |
| **Options** | **O-C7a — Strict CV-22 gate (required sequence):** Approve no real-only subset until all of: (i) PA-approved eligibility contract identifying the real subset (roster bound to exact D05 revision/checksum), (ii) authoritative per-instrument evidence pack (exchange listing + series mapping + entitlement), (iii) exact IRR identity mapping (`EQ_*_IN → canonicalSecurityId` + PIT `securityId` kept as distinct namespace), (iv) explicit consumer acceptance criteria + acceptance test (`CV-22-D05-REAL-EQUITY-IDENTITY-PROBE` or successor with positive/negative/ambiguous/effective-date cases), (v) repository-specific implementation authority. <br>**O-C7b — Approve roster-only (D05 revision + roster, no per-instrument external evidence):** PA-approved roster + D05 revision binding is sufficient; per-instrument external exchange evidence deferred. <br>**O-C7c — No real-only subset / retain 13 (CV-22 Option A):** Explicitly decline to widen to D05 for this release; retain IRR's 13 sector-reference `404 governed-row-not-found` behaviour for unrepresented instruments. |
| **Recommended disposition** | **O-C7a — Strict gate, no shortcut.** No real-only subset or consumer probe may be treated as authorized until the full C7 evidence chain (contract + roster + revision binding + identity mapping + acceptance criteria + implementation authority) is satisfied. Separately, the PA must explicitly record whether `CV-22` disposition is Option A (retain), B (bounded subset), or C (commission real-market coverage) — none is presumed. Until then, **no real-only consumer is admitted** and the probe must **not** be executed as acceptance. |
| **Rationale** | The reconciliation already identifies that widening to all 2,250 rows "without an explicit product/authority decision and approved classification would conflate real and synthetic" (§4.2) and that "no bulk D05 widening, fabricated identities, sector/name/fuzzy matching, synthetic-as-real promotion" is permitted (§9, rows 25/26). The IRR tracker recommendation of Option B is explicitly noted as **not a PA decision** — treating it as one would be precisely the unauthorized widening the request prohibits. The probe procedure is described as "proposal only" and "not executable authority" (`IIPS_V3_IPD_ONE_PASS_CONTINUATION_2026-10-18.md` §3). C1–C6 must be resolved first (classification semantics + evidence standard + scope split), otherwise any real-only subset would be built on unsupported labels. C7 is separate from C1–C6 because it gates a **consumer** admission (IRR) that is owned outside IPD and requires its own authority chain. |
| **Risks and consequences** | *If O-C7a strictly applied:* Real-only consumer coverage remains unavailable until full evidence chain is provided — honest limitation, preserves `404`/`UNMAPPED_IDENTIFIER` fail-closed behaviour for unrepresented instruments; protects against entitlement violation (NSE commercial entitlement noted as not established in reconciliation §4.2). <br>*If O-C7b (roster-only, no external evidence):* Faster but re-introduces source-reported roster as eligibility without external verification — same flaw as Finding A's 52/2198 split. <br>*If O-C7c (retain 13):* Explicitly defers widening — clean policy; no D05 identity work needed but real-instrument watchlist/portfolio remains unavailable. <br>*If deferred without explicit Option A/B/C disposition:* `CV-22` remains `DEFERRED` under Option C; IRR stays at Option C — which is the **current preserved behaviour** and must not be silently converted to Option B by inference from tracker text. |
| **Dependencies** | Depends on **C1** (classification permitted?), **C2** (evidence standard), **C6** (producer vs. consumer scope). C7 is **separate from** C1–C6 per request — it is the IRR consumer gate, not the IPD producer gate. Also depends on **IRR PA decision** (IRR is separate repository; IPD cannot decide IRR scope). |
| **Implementation authority** | **No.** Answering C7 does not itself authorize implementation. Each of the five elements (contract, roster, identity mapping, acceptance probe, implementation authority) requires **separate** PA acts, in distinct repositories where ownership dictates (IPD for D05 re-deposition, IRR for consumer route/adapter). The probe `CV-22-D05-REAL-EQUITY-IDENTITY-PROBE` is **not authorized for execution** until C7 criteria are met. |
| **Verification criteria** | (1) PA-signed decision record names exact D05 revision (`fileChecksumSha256: 7f53540b…` or successor) + explicit roster (e.g., `EQ_RELIANCE_IN` only, not "all 2,250"); (2) Per-instrument evidence packs exist (exchange listing, ISIN+series+symbol+effective-date, entitlement vendor attribution); (3) Exact IRR identity mapping documented (D05 `companyId` → IRR `canonicalSecurityId`; kept distinct from PIT `securityId`); (4) `CV-22-D05-REAL-EQUITY-IDENTITY-PROBE` executed **after** authorization with passing positive (RELIANCE) + negative (synthetic-as-real rejected, unknown→404, ambiguous→refusal, expired→404, PIT miss→typed miss) cases, bound to corpus hash; (5) Separate implementation authority act per repository naming exact baseline SHA, file set, tests, and acceptance evidence. |

---

## 4. Consolidated recommended policy — how C1–C7 fit together

### 4.1 One coherent recommended policy

> **Recommended consolidated policy (advisory; not a PA decision):**
>
> **Until the Program Authority answers C1–C7, IPD must not assert real/synthetic status, must not treat provenance/quality as eligibility, must not silently fabricate financial attributes, must not claim historical descriptor correctness, must not guess the correct AIIL scrip, and must not admit any real-only subset or widen any consumer universe. After PA answers, IPD may assert only what it has evidence for, under a producer/consumer separation.**

In procedural terms:

1. **Immediately prohibit false attestation (C1+C3):** Stop emitting `REAL` + `GOOD` as facts over all 2,250 records. In interim, emit `UNKNOWN`/`UNCLASSIFIED` (or suppress classification) and cease representing `sourceClassification`/`quality` as eligibility. This halts the §10.3 false attestation and C3 conflation at once.

2. **Name the evidence standard (C2):** PA must state that `REAL` requires external, independently verifiable evidence (exchange listing, MCA/issuer registry, owner attestation tied to `isin`+`companyId`+`effectiveFrom`) plus governed deposition binding (re-deposition with `fileChecksumSha256` + `authorizationRef`). ISIN check digit is explicitly **not evidence**; owner attestation alone is **not sufficient** for `REAL`.

3. **Separate concerns (C3+C6):** Establish that **provenance** (corpus revision/lineage), **quality** (descriptor completeness/freshness), and **eligibility** (consumer admission) are three distinct concerns (C3), with IPD publishing producer-scoped provenance/classification ("what this corpus is") and each consumer determining its own eligibility ("who may use it") (C6). This prevents `REAL` from silently becoming universal eligibility and makes the G-2 contract's IPD→IRR boundary workable.

4. **Fix absent-descriptor handling (C4):** When `faceValue`/`currency` evidence is insufficient, the system must use one of: reject, quarantine, or surface-as-unknown — or if legacy default retained, must accompany `1`/`INR` with quality downgrade (`≠ GOOD`, recommend `PARTIAL`) + anomaly code + user-visible disclosure. Preserve `faceValue: 0` ≠ absent distinction. Tighten `validateInstrumentMaster` and/or `SecurityMasterEntity` optionality accordingly.

5. **Permit synthetic display only with honest disclosure, non-production bounded (C5):** Synthetic/modelled records (`IT0001` et al.) may remain visible in `OFFLINE_BOOTSTRAP`/`LOCAL_FIXTURE` mode with explicit "Modelled/Synthetic — not a listed instrument" labelling and no `REAL` claim; no silent default (`C4`) without disclosure. Production/qualification/PIT/engine consumers must exclude synthetic/unclassified records.

6. **Do not guess AIIL (Finding D):** Preserve the observed concurrent mapping as **unresolved inconsistency** until PA + governed-data authority reconciles manifest wording vs. corpus effective dates (either corpus correction with new deposition/checksum, or manifest/report re-description as concurrent). No effective-date mutation without deposition.

7. **Gate real-only consumer admission strictly (C7):** No IRR (or other) real-only subset nor `CV-22-D05-REAL-EQUITY-IDENTITY-PROBE` is authorized until: PA-approved eligibility contract + explicit roster bound to `7f53540b…` (or successor) + per-instrument external evidence + exact `EQ_*_IN → canonicalSecurityId` mapping (distinct from PIT `securityId`) + acceptance criteria + separate implementation authority per repository.

8. **Preserve existing deferred behaviours:** `CV-22` remains **DEFERRED** under Option C with IRR's 13-row sector-reference `404` behaviour unchanged; `CV-20`/`CV-32`/`P11`/portfolio durability gates remain on their existing dispositions; IRR stays at `503 owner-context-unavailable` until its applicable gating sequence completes. No inference from tracker recommendation text.

### 4.2 Assessment of the seven proposed safeguards

The decision request (task statement) proposes that evidence supports at least these safeguards. Each is assessed against authoritative contracts:

| # | Safeguard | Supported by existing contracts? | Challenge? | Recommendation |
|---|---|---|---|---|
| S1 | **Do not assert real/synthetic status without authoritative evidence.** | **Yes — strongest.** `PHASE2-EVIDENCE-PAYLOAD-FORENSIC-REPORT.md` §10.3 already prohibits `REAL` over invented data as false attestation. D05 contract has no classification field (verified); 52/2198 split is source-reported, not issuer truth (reconciliation §25). No existing contract authorizes `REAL` for all 2,250. | No challenge — but note: the `AUTH-D05-BROAD-UNIVERSE-MASTER-EXPANSION-ACT-2026-09-22-001` authorizes deposition (quantity + checksum), not classification — cannot be cited as classification authority. | **Adopt** as immediate prohibition (C1). |
| S2 | **Do not represent a quality or provenance assertion as proof of consumer eligibility.** | **Yes — follows from C3 definition.** `ExecutiveProvenance` (`sourceClassification`, `quality`, `dataVersion`, `lineageDigest`) and `QualityState` are distinct types from any eligibility concept; no eligibility contract exists (`CV-22` deferred). `G2` contract contemplates consumer-scoped admission separate from producer assertion. | No challenge. The current conflation (Finding A/C) is contradicted by `PHASE2` standard that `sourceClassification` is a governed attestation, not an eligibility flag. | **Adopt** strict separation (C3+C6). |
| S3 | **Do not silently represent substituted descriptor values as source-confirmed facts.** | **Yes — contract requires faceValue/currency, entity permits absent, resolver fabricates.** `InstrumentMasterPayload` declares `faceValue: number` + `currency` required; `SecurityMasterEntity` optionally types them; `validateInstrumentMaster` does **not** validate them; F-3 act is silent on absent handling. Silent `1`/`INR` + `GOOD` contradicts `QualityState` hierarchy (`GOOD` = validated). | No challenge — but note: tightening to required would be a **contract change** requiring PA; until then, silent fallback is not validated by any current contract. | **Adopt** reject/quarantine/unknown-or-disclosed-default (C4). |
| S4 | **Do not claim historical descriptor correctness when only identity mapping is time-aware.** | **Yes — distinction is proved.** Identity mapping is asOf-aware (`CHAR-C-01` approved invariant, `P04-BOOTSTRAP-03`/`QUAL-08`); descriptor retrieval is not (`CHAR-C-02` defect, `getEntity` = `Map.get`). F-3 act §2 requires "full resolution descriptor" but is **silent on descriptor temporal validity** — so descriptor-versioning cannot be assumed. Corpus has uniform `effectiveFrom`, no `effectiveTo` — no temporal descriptor data exists. | No challenge. Note: Adding descriptor history would be **new capability** (request §4 "Expressly NOT blocked" vs. blocked table) requiring new scope decision, not a修复 of a regression. | **Adopt** as current-payload honesty rule; add scope-gate for any future versioning. |
| S5 | **Do not resolve the AIIL inconsistency by guessing which source is wrong.** | **Yes — mismatch is confirmed.** Manifest `RULING_3_DUAL_EFFECTIVE_DATED_MAPPING` vs. corpus concurrent duplicate (no effectiveTo, both scrips resolve at all dates) vs. report "current+historical" wording — three-way mismatch. Either correction (corpus effective dates vs. manifest wording) is a **governed-data change** (request §4 blocked row). `CHAR-D-01` explicitly prohibits asserting which scrip is current. | No challenge. Existing `d05_browser_runtime_hydration.test.ts` `HYDRATION-03` pins concurrent resolution but does not establish effective dating — it cannot be cited to prove either direction. | **Adopt** as unresolved-inconsistency hold; require PA + deposition authority for either correction. |
| S6 | **Do not admit a real-only subset or widen the D05 universe without an explicit, evidence-backed eligibility basis.** | **Yes — `CV-22` deferred.** Reconciliation §4.2: "Widening to all D05 rows without an explicit product/authority decision and approved classification would conflate real and synthetic." `CV-22-D05-REAL-EQUITY-IDENTITY-PROBE` is proposal only, not authorized. IRR tracker Option B is **recommendation**, not PA decision. | No challenge. Note: The broader prohibition follows from C1–C3 — even a partial roster (e.g., 52 named issuers) requires per-instrument external evidence (C2) because source-reported narrative ≠ verification. | **Adopt** as C7 strict gate. |
| S7 | **Preserve the existing IRR CV-22 Option C deferral and current 13-row governed sector-reference behavior unless a separate authorized decision changes them.** | **Yes — preserved by reconciliation.** `IIPS_V3_IPD_IRR_PORTFOLIO_AND_CONSUMER_READINESS_RECONCILIATION_2026-10-18.md` §4.1, §9 rows 25/26, and `IIPS_V3_IPD_ONE_PASS_CONTINUATION_2026-10-18.md` §5 all record `CV-22` as `DECISION REQUIRED`, IRR 13 rows as **sector references** (`canonicalSecurityId = sector`, not instrument identities), with `404 governed-row-not-found` as existing honest refusal; `IIPS_V3_G2_IPD_IRR_PORTFOLIO_CONSUMER_CONTRACT_V1_2026-10-18.md` §10 lists what contract acceptance does **not** authorize (including universe widening). No existing PA act admits D05 to IRR. | No challenge — but clarify: preserving 13-row sector behaviour is **not** the same as preserving a 13-instrument security master. The safeguard must be read as "preserve sector-reference `404` fail-closed for unrepresented instruments, do not treat tracker Option B text as decision." | **Adopt** explicitly: keep IRR `404` fail-closed + `503` fence + `SESSION_ONLY` until Option A/B/C PA disposition + C7 chain. |

**Overall challenge assessment:** No existing authoritative contract contradicts any of the seven safeguards. Where a contract is silent (F-3 on absent descriptors / descriptor history), silence is **not** authorization — the request §5 and the forensic §10.3 standard both treat silence as requiring a PA decision, not implied permission. The only apparent tension — that the D05 broad-universe deposition exists at all — is resolved by the `OFFLINE_BOOTSTRAP` / `TIER_2_ACTIVE_NSE_CM` operating mode boundary, which permits broad scaffolding for non-production testing while prohibiting production/eligibility claims.

---

## 5. Keep decisions and implementation separate — boundaries observed

This review observed the stopping point (task §5):

- **No production source, test, D05 data, schema, manifest, or configuration was modified.** Working tree clean apart from this additive, non-operative review document.
- **No recommendation recorded as operative decision.** All "recommended dispositions" are explicitly advisory; each requires a dated PA decision record on IPD `main` answering C1–C7 (or explicitly deferring each) per request §6 — not satisfied by this review.
- **No implementation authority created or implied.** Request §4 "Implementation work that remains BLOCKED pending this decision" table remains fully in force; none of the blocked items (hard-coded classification repair, faceValue/currency policy change, synthetic display change, historical-descriptor capability, AIIL reconciliation, eligibility discriminator/roster, IRR consumer mapping/probe) is authorized.
- **No IRR modification.** IRR `CV-22` remains **DEFERRED** under Option C; IRR `main` inspected read-only at `e9bb64c2` analogue (not modified).
- **No new service, endpoint, database, or consumer integration introduced.**
- **No product acceptance, qualification, admission, or production readiness claimed.** All 565 current tests are observations; the eight characterization tests remain `UNRESOLVED` observations, not acceptance.
- **Existing authority acts preserved:** `PHASE-F3-UI08-SECURITY-MASTER-FUNCTIONAL-AUTHORITY-ACT.md` §2 is boundary (not violated); `AUTH-D05-BROAD-UNIVERSE-MASTER-EXPANSION-ACT-2026-09-22-001` remains deposition-only; G2 consumer contract `ACCEPTED` but `NOT IMPLEMENTED/NOT QUALIFIED`; G3-D0 `G3-D0 RESOLVED — RE-AUTHOR THE INTENDED IMPLEMENTATION BASIS ON IPD main` preserved (off-main `cec7080` reference-only, not admitted base).

---

## 6. Closing — required PA response

### 6.1 The seven recommended dispositions (summary)

| # | Question | Recommendation | One-line summary |
|---|---|---|---|
| **C1** | Record-origin classification | **Prohibit `REAL` now → permit only with evidence → require `UNKNOWN`** | Do not emit `REAL`; interim `UNKNOWN`/suppressed; future per-record only with C2 binding |
| **C2** | Evidence supporting classification | **External verifiable evidence + governed deposition** | Exchange/MCA/owner evidence + `fileChecksumSha256`-bound re-deposition; ISIN check digit rejected |
| **C3** | Provenance/quality/eligibility separate? | **Strict separation** | Three distinct concerns; no reuse of one value as another |
| **C4** | Insufficient-evidence assertion | **Surface-as-unknown or default+disclosure (quality ≠ GOOD)** | Reject/quarantine/unknown preferred; if default, mandatory downgrade+anomaly+UI signal |
| **C5** | Display synthetic/incompletely classified? | **Permit only non-production with mandatory disclosure** | `OFFLINE_BOOTSTRAP` only, with PA-approved synthetic labelling, no `REAL` |
| **C6** | Universal vs. capability-dependent? | **Producer-scoped + consumer-scoped split** | IPD infrastructure producer assertion; each consumer its own eligibility roster/contract |
| **C7** | Real-only consumer subset criteria | **Strict 5-part gate; no probe until authorized** | Contract + roster + revision binding + identity mapping + acceptance + impl authority |

### 6.2 Recommended consolidated policy (summary)

Do not assert `REAL`/`GOOD` without per-record governed evidence; do not conflate provenance/quality with eligibility; do not silently fabricate `faceValue`/`currency`; do not claim historical descriptor correctness beyond identity mapping; do not guess AIIL scrip direction; do not admit any real-only subset or widen D05 until the full `CV-22` chain is satisfied; keep IRR at Option C sector-reference `404`/`503` and IPD at `SESSION_ONLY` until separate PA acts change them. (Full wording in §4.1.)

### 6.3 Material conflicts or evidence gaps that prevent a defensible recommendation

1. **No schema/enum vocabulary selected** (request §5: "No schema, field, property, enum or type name is proposed" — prose vocabulary "record-origin classification" is not frozen). Any implementation recommendation would be premature without PA-chosen names.
2. **No external issuer/exchange verification inspected** in this pass (reconciliation §25: synthetic split remains source-reported, not independently verified). C2 evidence standard cannot be satisfied from current IPD evidence alone.
3. **AIIL external listing-history evidence missing** — without BSE records establishing scrip succession dates, the corpus effective-date correction cannot be evidenced.
4. **IRR PA decision outstanding** on `CV-22` Option A/B/C — IPD cannot decide IRR consumer admission (IRR owns consumer adapter/routes/UI); C7 recommendations are therefore advisory to IRR's PA capacity, not IPD's.
5. **D05 validation vs. entity model contradiction** (`validateInstrumentMaster` requires `faceValue`/`currency` but does not validate; `SecurityMasterEntity` permits optional) — PA must resolve whether to tighten type/validation or permit absent-with-disclosure before C4 can be implemented without schema drift.
6. **Existing ~20 assertions expecting `REAL`** (request §4) — implementation would be a breaking change requiring deliberate test updates; the review cannot name replacement values without C1/C2 vocabulary decision.

None of these gaps is resolved by this review; each requires the PA decisions identified in §6.4.

### 6.4 Exact decisions requiring the Program Authority's response

The PA must produce a **dated decision record on IPD `main`** (per request §6) that:

1. **Answers or explicitly defers each of C1–C7 individually** — no blanket "adopt recommendations" without per-question disposition; deferrals must state reason and prerequisites for reconsideration.
2. **States the evidence standard for each permitted assertion (C2)** — naming the external source(s), who may supply, and how per-record binding to `fileChecksumSha256` is established.
3. **States whether semantics are producer-scoped, consumer-scoped, or both (C6)** — and explicitly whether `CV-22` is dispositioned as Option A (retain 13), B (bounded D05 subset), or C (deferred/commission real-market coverage).
4. **If any repair is authorized:** names the exact post-review IPD `main` SHA (verified tip `02a5803` will advance upon decision publication), the permitted file set (e.g., `src/transports/object_resolver.ts`, `src/contracts/*`, `src/identity/*`, `frontend/src/features/security-master/*`, `tests/d05_identity_eligibility_characterization.test.ts`), the bounded scope limits (no G24 promotion, no durable writes, no route admission, no production use — per G3-D0), the required tests, and the acceptance evidence for a **separate** implementation act — as required by request §6.4.
5. **Reconciles AIIL (Finding D)** — with explicit direction on whether to correct corpus effective dates (with new deposition/checksum) or correct manifest/report wording (accept concurrent dual), with PA citation to external BSE evidence if corpus correction chosen.

Until the PA record is published, **no** real-only subset, universe widening, probe execution, descriptor-default change, synthetic-display change, or AIIL effective-date mutation is authorized.

### 6.5 Clear statement — no operative decision or implementation authorization created

**This review creates no operative Program Authority decision and authorizes no implementation.**

It is an evidence synthesis and recommendation record only. It does not implement production repairs, change governed semantics, record any recommendation as approved, modify IRR, reopen the `CV-22` probe, introduce any service/endpoint/database/consumer integration, or claim product acceptance/qualification/admission/production readiness. The existing eight characterization tests remain observations of unresolved behaviour — not an implicit acceptance contract.

**Stop after delivering the review. Wait for the Program Authority's decision before any production repair.**

---

## Evidence index (curated sources inspected for this review)

- Decision request: `evidence/cross-repository/IIPS_V3_IPD_PROVENANCE_ELIGIBILITY_AUTHORITY_DECISION_REQUEST_2026-10-19.md` (C1–C7 verbatim, Findings A–D §§2.1–2.6, blocked-work §4, boundaries §5)
- Resolver: `src/transports/object_resolver.ts:43-72` (literals + fallback)
- Security Master: `src/identity/security_master.ts:27-114` (`registerEntity` no-validation, `getEntity` asOf-unaware)
- Mapping Store: `src/identity/mapping_store.ts:34-50` (effective-date window)
- Governed Fixture Master: `src/identity/governed_fixture_master.ts:4-8, 27-131` (operating modes, 5-entity vs. 2,250, `UTIBANK`/`AGI GREENPAC` mappings)
- D05 Corpus: `src/identity/d05_broad_universe_data.ts` (2,250 records; `EQ_RELIANCE_IN` index 0, `EQ_AIIL_IN` index 20, `EQ_AGI_IN` index 21, `IT0001` index 52 — all `2015-01-01T00:00:00.000Z`, no `effectiveTo`)
- D05 Contract: `src/contracts/d05_security_master.ts:34-37, 54-82` (required fields but no faceValue/currency validation)
- Types/Provenance: `src/contracts/types.ts` (`QualityState`, `SourceClassification`), `src/contracts/provenance.ts` (`computeLineageHash`), `src/transports/types.ts` (`ExecutiveProvenance`, `AD17_CONSTRAINT_TEXT`)
- UI08 Surface: `frontend/src/features/security-master/SecurityMasterSurface.tsx:228-246` (resolver rendering), `src/ui/view_models/ui08_security_master_modal.ts` (builder)
- F-3 Authority Act: `evidence/target-shell-integration/PHASE-F3-UI08-SECURITY-MASTER-FUNCTIONAL-AUTHORITY-ACT.md` §§1–6 (existing contract: "full resolution descriptor" silent on temporal validity / absent handling)
- Forensic Standard: `evidence/target-shell-integration/PHASE2-EVIDENCE-PAYLOAD-FORENSIC-REPORT.md` §10.3 (false attestation standard), §§5–6 (zero join on lineage+identity)
- Hydration/Manifest: `evidence/operator_drop/d05_security_master_manifest.json` (`aiilRuling: RULING_3_DUAL_EFFECTIVE_DATED_MAPPING`, `fileChecksumSha256: 7f53540b…74b5`), `evidence/operator_drop/d05_browser_runtime_hydration_report.md` (§2.5 "543989 current + 539177 historical", §2 browser-safe architecture)
- Characterization Tests: `tests/d05_identity_eligibility_characterization.test.ts` (`CHAR-A-01/02`, `CHAR-B-01/02/03`, `CHAR-C-01/02`, `CHAR-D-01`)
- Audit/Tracker: `BLOCK-3L-BROKER-CSV-FULL-RESOLUTION-AUDIT.md` (52/2198 split, definitive finding), `evidence/cross-repository/IIPS_V3_IPD_IRR_PORTFOLIO_AND_CONSUMER_READINESS_RECONCILIATION_2026-10-18.md` (§4.1/§4.2/§9 rows 25/26), `evidence/cross-repository/IIPS_V3_G2_IPD_IRR_PORTFOLIO_CONSUMER_CONTRACT_V1_2026-10-18.md` (consumer contract), `evidence/cross-repository/IIPS_V3_IPD_ONE_PASS_CONTINUATION_2026-10-18.md` (§3–§5), `evidence/np04/IIPS_v3.0_IPD_IRR_CAPABILITY_INVENTORY_AND_TRACKER_RECONCILIATION_2026-10-17.md` (§8.1 workbook, rows 25/26), `docs/FULL_IIPS_BI08_CONVERGENCE_FILE_MATRIX.md`, `docs/FULL_IIPS_BI08_CONVERGENCE_PLAN.md`
- Verification: `origin/main` at `02a5803145cf215083caf80f54ba1ac458e1682c` (PR #26 merged 2026-10-19T16:45:49Z), build `tsp` 5.9.3 0 errors, tests `565 pass` (full suite), `git fetch`/`git rev-parse`/`git show` outputs

---

*End of decision review. No operative decision rendered. Implementation authority not granted.*
