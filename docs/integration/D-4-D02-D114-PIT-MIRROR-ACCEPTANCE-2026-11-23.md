# D-4 — IPD Mirror Acceptance Record: D02 / D114-PIT Historical Authority (Option C)

**Document ID:** `IPD-D4-MIRROR-ACCEPTANCE-2026-11-23`
**Decision ID:** `D-4` (`D-4.1` through `D-4.7`) — Dhan Live Integration roadmap `DHAN-LIVE-ROADMAP-2026-11-11`, Phase 0
**Status:** **COMPLETE — OWNER APPROVED (2026-11-23), IRR ACCEPTED, IPD MIRROR ACCEPTED**
**Approved by:** Programme Owner (sole PA/PO for this personal, single-user, non-production application)
**Owner approval date:** **23 November 2026** (owner disposition `approve_all_d4`, recorded in IRR acceptance §1)
**Decision scope:** D02 (Dhan historical OHLCV) vs D114/PIT historical precedence and the seven associated
architecture decisions `D-4.1`–`D-4.7`, including source authority, source selection, D02 freshness,
corporate-action handling, D114/PIT admission, D01/D02 identity symmetry and report reproducibility.
**Repository:** `ramkivs/iips-production-market-data` (IPD), branch `arena/c76ff83a-iips-production-market-data`
**IPD verification baseline:** `main` `84e988b092058df8075ffa52f5dfb0f4fef07eaf` (merge of IPD PR #189)
**IPD publication commit:** `<see §10 — recorded in the follow-up commit that carries this identifier>`

### Authoritative IRR counterpart records (verified by inspection, not by assertion)

| Role | Record | Identity |
|---|---|---|
| IRR owner acceptance (the approval act) | `IRR:docs/integration/DHAN-D4-OWNER-ACCEPTANCE-2026-11-23.md` | IRR commit `b9d6c2f1aaee351d3583bc0789357c0373386932`, merged to IRR `main` as `8f89311273afc9c488db1144aed5112511613a53` (PR #627); blob `6677945c936df4f39e541d496dbec9f811fbf051`; SHA-256 `b066a9e3b96c90b4877b6788d510546764d02c777cf7a8aef7f38442f6dedcad` |
| IRR decision proposal (the approved wording) | `IRR:docs/integration/DHAN-D4-OWNER-DECISION-PROPOSAL-2026-11-23.md` | IRR commit `b9d6c2f`; blob `2323444ee237bf0ffd082020cd8e1a3cf5dbc43f`; SHA-256 `84e764381348dacd50fe2e0816c6c2e7478525aea50610bb8af1304067066e86`; decision text §7, decisions list §20 |
| IRR architecture assessment (technical reference) | `IRR:docs/integration/DHAN-D02-VS-D114-PIT-ARCHITECTURE-ASSESSMENT-2026-11-23.md` | IRR commit `b9d6c2f`; blob `eb836ed835d0246cbb94b4a1dc3d659fc2a5a39e`; SHA-256 `48b1f8f10aa48911342abda6287219d7ea61a548e1bfd72812076987fcacd767` |
| IRR W-12 historical request-builder verification | `IRR:docs/integration/DHAN-W12-HISTORICAL-REQUEST-VERIFICATION-2026-11-23.md` | IRR commit `b9d6c2f`; blob `2a758b31bc4b516f58ba56a1c0c6caa81dcecdf3`; SHA-256 `a6c4738175f8bfdc336cc1482a160802742ded2240de6030f003ad7bd58d2c50` |

### Identifier disambiguation (required — IPD already uses "D4" for unrelated decisions)

This record is Dhan roadmap decision **`D-4`** (D02 vs D114/PIT precedence, owner `IPD + IRR` per
`DHAN-LIVE-ROADMAP-2026-11-11` Appendix A). It is **not**:

- the W04 identity-provisioning decisions `D1`–`D4` in `docs/integration/IIPS-W04-IDENTITY-PROVISIONING-DECISIONS-D1-D4-2026-11-13.md`;
- the NP-04 **D4 broker-preview** owner acceptance in `evidence/np04/IIPS_v3.0_D4_BROKER_PREVIEW_OWNER_ACCEPTANCE_RECORD_2026-10-18.md`;
- Dhan decision `D-5` (bid/ask representation), `D-3` (market-closed freshness) or `D-7` (provider state model).

---

## 1. Executive acceptance summary

| Governance axis | Recorded status | Scope and conditions |
|---|---|---|
| **Programme Owner disposition** | **APPROVED — `approve_all_d4`, 23 November 2026** | Owner approved `D-4.1` through `D-4.7` **as proposed** for the joint IPD + IRR architecture, explicitly requiring the joint IPD/IRR status to be recorded. |
| **IRR acceptance** | **ACCEPTED; merged to IRR `main`** | `DHAN-D4-OWNER-ACCEPTANCE-2026-11-23.md` at `b9d6c2f`, merged `8f893112` (PR #627). |
| **IPD mirror acceptance (this record)** | **ACCEPTED — COMPLETE** | IPD adopts the approved `D-4.1`–`D-4.7` architecture and records its own obligations, verified state and open preconditions. Acceptance is **not** implementation authority (§8). |
| **Discrepancies between repositories** | **3 reported — none contradicts the approved architecture** | Numbering/citation divergence in the IRR acceptance record, a stale numeric premise in canonical `D-4.6`, and one imprecise PIT-store description. Each is identified, bounded and assigned an owner in §5. Reporting them is part of the acceptance, not an exception to it. |
| **Effective scope limits** | **Design and sequencing gate only** | `D-4` acceptance does **not**: authorize `W-19`/`W-20` implementation, authorize any live Dhan `E4` request (quotes or `/charts/historical`), lift the `B2`/`CV-32` non-production PIT boundary, or constitute Stage 5 / product admission. |
| **`W-20` (IRR historical D02 route/UI)** | **BLOCKED — unchanged by this record** | Still sequenced behind `W-12` → `W-17`/`W-14` → `W-19` (§6, §9). |

### Acceptance statement

IPD accepts `D-4.1` through `D-4.7` as the governing architecture for D02 versus D114/PIT historical
authority, on the canonical decision wording at IRR proposal **§7** and **§20**, for the scope, dates and
references recorded above, subject only to the discrepancies reported in §5 (which change no approved
decision, but require an IRR-side textual erratum and an IPD evidence correction).

---

## 2. How the approved baseline was established

1. **IRR merge verified from the remote, not from a summary.** A fresh clone of
   `ramkivs/iips-review-recovered` was inspected: `main` HEAD = `8f89311273afc9c488db1144aed5112511613a53`
   ("Merge pull request #627 from ramkivs/arena/fbeebd7c-iips-review-recovered"), parent acceptance commit
   `b9d6c2f1aaee351d3583bc0789357c0373386932` (authored 2026-11-23T16:47:43Z), PR #627 merged
   2026-11-23T17:25:21Z. The acceptance file's Git blob and SHA-256 were recorded at both `b9d6c2f` and
   `main` and are identical, i.e. the merge did not alter the accepted text.
2. **Exact approved wording located, not assumed.** The owner's `approve_all_d4` disposition approved the
   decisions *as proposed*. The proposed decision identities and text are IRR proposal **§7
   ("The Seven D-4 Decision Areas (`D-4.1` – `D-4.7`)")** with the decision list at **§20
   ("Explicit Owner Decisions Requested")**. Those are the canonical `D-4.n` definitions used in §3.
3. **IPD baseline verified.** `git merge-base --is-ancestor` confirms IRR's pinned IPD commit
   `2685562522f1a2fd1d745a7857f771bf21453315` (PR #176) is an ancestor of IPD `main`
   `84e988b092058df8075ffa52f5dfb0f4fef07eaf`, so the IRR pin and IPD `main` are consistent. IPD CI check
   runs for `84e988b` are `success` for both "typecheck · build · test" and "executed test count".
4. **IPD side inspected directly** (source, contracts, committed evidence, package exports), and every
   claim about current IPD behaviour in §3 is either a file/line citation or an executed probe recorded
   in §7. No IPD claim in this record is inherited from an IRR document.

---

## 3. The seven approved decisions, and IPD's verified position

Legend for the status column: **ALIGNED** = IPD behaviour already satisfies the decision;
**ALIGNED / OPEN OBLIGATION** = decision adopted, IPD implementation work remains (named, gated);
**PARTIAL** = decision adopted, IPD satisfies part of it and the remainder is a recorded open obligation.

### D-4.1 — Source authority by use case (Option C)

**Approved (IRR proposal §7 `D-4.1`, §20 item 1):** adopt **Option C** — Dhan `D02` answers historical
charting, intraday candles and ad-hoc date-range price inspection (once `W-12`/`W-13`/`W-14`/`W-19` are
complete); `IID` valuation and Margin of Safety keep the **existing `R-6` rule**
(`PIT_D01 → DATASET_EOD → withhold`); `D114/PIT` is reserved for point-in-time (`asOf`) replay and future
backtesting, remaining non-production until a dedicated product-admission package is approved; persisted
reports embed immutable observations inside `NP-04`.

**IPD position — ALIGNED.** IPD exposes one market-data authority per route and a separate freshness read:
`POST /v1/quotes` (D01), `POST /v1/historical` (D02, adapter `DhanHistoricalAdapter`), `GET /v1/freshness`
with domains `D01_QUOTES` and `D02_OHLCV` (`docs/IPD-P5-FRESHNESS-HTTP.md`,
`src/providers/dhan/dhan_market_data_http.ts`). IPD contains **no** D02→PIT substitution or blending path.
Valuation / Margin of Safety logic is not IPD code; IPD's obligation is only to keep `D02` candles truthful
and unadjusted (§D-4.4). D114/PIT is published only as non-production library packages `./pit` and
`./d114-non-production` (`package.json`), with no product HTTP surface (§D-4.5).

### D-4.2 — Source selection and failure behaviour (no silent fallback, no blending)

**Approved (§7 `D-4.2`, §20 item 2):** every consumer declares its capability
(`range_ohlcv → D02`, `pit_as_of → D114/PIT`, `valuation_mos → IID R-6`); a source failure or an empty
result surfaces as an explicit typed failure / empty result — never a substituted source and never candles
stitched across sources; payloads and UI carry explicit source, requested-vs-returned counts,
`coverageClaim` and `isAdjusted`.

**IPD position — ALIGNED (IPD half).** Request routing is explicit, one route per authority; failures are
typed (`DhanFailure` codes) with no fallback branch in the historical adapter; a uniformly empty series is
a valid `0`-candle result rather than a substituted source
(`src/providers/dhan/dhan_historical_adapter.ts`, `dhan_historical_dto.ts`); the D02 result carries
`requestedFromDate`, `requestedToDate`, `returnedCandleCount` and
`coverageClaim: 'ACCESS_PENDING_UNVERIFIED'`. The consumer-side source labelling and the prohibition on
blending remain IRR implementation obligations inside `W-20`/`W-39`.

### D-4.3 — D02 freshness must be truthful; unknown stays unknown

**Approved (§7 `D-4.3`, §20 item 3):** remove any hardcoded `SNAPSHOT` freshness for `D02`; report `D02`
freshness strictly from IPD evidence, using `marketTimestamp`, `providerResponseTimestamp`,
`retrievalTimestamp` and `cacheTimestamp`; until `W-19` is wired, report D02 freshness as unavailable /
unknown rather than fabricating a status.

**IPD position — ALIGNED / OPEN OBLIGATION (`W-19`, IPD-owned).** Verified by execution (§7.5):
`GET /v1/freshness?domain=D02_OHLCV` yields `cacheState: NOT_AVAILABLE`, `verdict: UNKNOWN`,
`timestampEvidence: NOT_AVAILABLE`, `asOf/receivedAt/observationEvaluatedAt: null`,
`eligibleForUse: false`, `suppressExecution: true`. This is the honest-unknown behaviour the decision
requires. IPD also refuses to infer an observation timestamp from a candle
(`docs/IPD-P5-FRESHNESS-HTTP.md`). **Open:** the composed D02 path calls the adapter directly and does not
wire the historical cache/orchestrator, so `providerResponseTimestamp` and `cacheTimestamp` are not yet
produced for D02; per-candle `dailyFreshness` is emitted only for `1D` with a configured trading calendar.
Wiring `DhanHistoricalCache` and the four-timestamp model is IPD's `W-19` deliverable and a stated `W-20`
precondition.

### D-4.4 — Corporate actions: adjustment disclosure and valuation safeguards

**Approved (§7 `D-4.4`, §20 item 4):** while `D02` reports `isAdjusted: false`, charts and tables must
carry an explicit "unadjusted for corporate actions" disclosure; unadjusted `D02` prices are prohibited
from driving split-sensitive valuation or return attribution until adjustment is verified and modelled;
`margin.ts`'s hard refusal (`UNADJUSTED_PRICE_ACROSS_CORPORATE_ACTION`) is preserved.

**IPD position — ALIGNED (IPD half).** `isAdjusted: false` is **declared, not assumed** by the adapter
("Adjustment status is unverified pre-access"), with `coverageClaim: ACCESS_PENDING_UNVERIFIED`
(`dhan_historical_adapter.ts`). IPD applies no adjustment and fabricates no adjusted history. IPD's PIT
corporate-action helpers (`src/pit/corporate_actions.ts`: `calculateSplitFactor`, `calculateBonusFactor`,
`computeCumulativeFactor`, `adjustHistoricalPrice`) exist but are **not** applied to D02 series and no
adjustment-factor timeline is emitted with D02 candles. The UI disclosure and the `margin.ts` valuation
refusal are IRR/IID obligations; an adjustment model for D02 is not authorized by `D-4` and remains a
future, separately approved change.

### D-4.5 — D114/PIT admission: retain the `B2`/`CV-32` non-production boundary

**Approved (§7 `D-4.5`, §20 item 5):** keep Gate `B2` and `CV-32`
(`API-ONLY`, `P4 retained, NOT ADMITTED`) intact; wider product use of D114/PIT requires durable storage,
verified Bhavcopy ingestion beyond fixtures, four-timestamp temporal metadata and an explicit PA admission
packet; backtesting additionally requires an `asOf` range-over-time query contract, correction/restatement
handling, a corporate-action timeline aligned to `asOf` and digest verification.

**IPD position — ALIGNED.** IPD exposes **no** `/api/pit/market-data` or other PIT product route; PIT is
available only as libraries (`./pit`, `./d114-non-production`) plus a durable store
(`src/pit/pit_durable_store.ts`, append-only `pit001_market_data_snapshots`, own migration ledger,
deliberately isolated from the Gate 3 / Gate A′ schema). Non-production D114 population is three archived
Bhavcopy fixtures (2024-06-28 legacy format; 2026-01-05 and 2026-02-10 UDiFF) — see §5 `D4-DR-03`. IPD
makes **no** product-admission claim and does not treat the durable store's existence as admission.

### D-4.6 — D01/D02 exact security-identity symmetry

**Approved (§7 `D-4.6`, §20 item 6):** both `D01` and `D02` require exact canonical identity
(`companyId` + `ISIN:<isin>:<series>` + `exchangeSegment`), rejecting `companyId`-only historical ambiguity
at the governed boundary — or at minimum requiring `exchangeSegment` + canonical `securityId` when `W-20`
activates; mapping provenance must match the `W-27`/`W-28` exact matcher and wrong-ID protection
(`UNRESOLVED_INSTRUMENT`, no symbol/fuzzy matching) must apply identically.

**IPD position — PARTIAL (open IPD obligation, gated to `W-20` activation).** Verified by execution (§7.5):
`D01` rejects a `companyId`-only quote with `MALFORMED_REQUEST`
("quotes require companyId and a canonical D114 securityIdentity (ISIN:<isin>:<series>)"); `D02` **accepts**
a `companyId`-only historical request at the same boundary. The registry still fails closed: company-level
resolution returns `UNRESOLVED_INSTRUMENT` / `AMBIGUOUS_MAPPING`
("a complete security identity (segment + ISIN) is required") whenever more than one security exists for a
company, and `resolveListing` demands an ISIN when a segment holds several securities. So the *safety*
property holds, while the *boundary symmetry* required by `D-4.6` does not yet. The approved decision
allows this to be completed "at minimum … when `W-20` activates"; it is recorded here as an IPD obligation,
not as a contradiction. IPD's `W-27` pipeline uses the same exact matcher and never reads symbol, company
name or display name (`src/providers/dhan/dhan_mapping_expansion.ts`).

### D-4.7 — Persisted report reproducibility (immutable NP-04 artifacts)

**Approved (§7 `D-4.7`, §20 item 7):** every `NP-06` report or `IID` assessment that references market
prices embeds an immutable `HistoricalPriceEvidence` block inside the persisted `NP-04` payload
(`source`, `securityIdentity`, `marketTimestamp`, `observationTimestamp`/`retrievalTimestamp`,
`dataValues`, `adjustmentStatus`, `sourceProvenance` incl. `dataVersion`/`lineageHash`/`coverageClaim`,
`schemaVersion`/`completeness`); stored artifacts render verbatim and a new version records a new block for
side-by-side diffing.

**IPD position — PARTIAL (IPD supplies observations; artifact embedding is not IPD code).** `NP-04`
(`iips-np04-governed-persistence`) is a separate governed boundary consumed by IRR, not an IPD write path;
IRR pins it separately and IPD neither writes nor mints NP-04 artifacts. IPD's obligation is to deliver
exact, provenance-bearing observations: D02 results carry the requested range, `returnedCandleCount`,
`coverageClaim`, exact candle timestamps and declared `isAdjusted` — **but no series-level `dataVersion` or
`lineageHash`**, which D01 quote envelopes do carry (`computeLineageHash`/`DHAN_CANONICAL_DATA_VERSION` in
`dhan_normalizer.ts`). Emitting a D02 series digest is therefore a recorded IPD prerequisite for a fully
reproducible `HistoricalPriceEvidence` block; the embedding itself and its immutability remain
IRR/NP-04-owned.

---

## 4. Cross-repository consistency verification

The material question is whether the same seven decisions were accepted in both repositories. The IRR
acceptance record's §2 re-states seven items under the headings `D-4.1`–`D-4.7`, but its content does not
align one-to-one with the canonical proposal numbering. The verified mapping is:

| IRR acceptance §2 item (as labelled there) | Substance of that item | Canonical proposal decision(s) actually covered | Verdict |
|---|---|---|---|
| `D-4.1` "Adopt Option C (Dual-Layer Architecture)" | D01 quotes, D02 OHLCV, D114/PIT immutable non-production, NP-04 sole persistence | `D-4.1` (source authority) + `D-4.7` (NP-04 embedding) | Consistent; covers two canonical decisions under one number |
| `D-4.2` "Preserve `B2`/`CV-32` gate" | PIT stays non-production, fail-closed | `D-4.5` | Consistent; canonical `D-4.2` (explicit selection / no fallback) is **not** restated |
| `D-4.3` "Maintain `IID` `R-6`/`Q-5` & D02 history gate" | `R-6` preserved; `isAdjusted: false`, `coverageClaim: ACCESS_PENDING_UNVERIFIED`; no fabricated adjusted history | `D-4.1` (R-6 limb) + `D-4.4` (adjustment limb) | Consistent; canonical `D-4.3` (truthful D02 freshness) is **not** restated as a decision |
| `D-4.4` "Preserve `W-29` shared quote boundary & `W-11` transport discipline" | Server-side authenticated loopback transport; `D-7` disclosure | No canonical `D-4.n`; this is implementation discipline from proposal §9–§10 and existing `W-29`/`W-11` governance | Consistent, additive condition |
| `D-4.5` "Decouple `W-06` live quote freshness gate from `W-14` `E4` qualification" | `W-06` `PARTIAL` tracked separately from `W-14` | No canonical `D-4.n`; proposal §6 reconciliation | Consistent, additive condition |
| `D-4.6` "Require `W-12` historical request-builder & `G-08`/`G-12` verification before live `D02`" | Builder/serialization must be verified before execution | No canonical `D-4.n`; proposal §18 dependency and §19 risk 2 | Consistent, additive condition |
| `D-4.7` "Sequencing rule (`W-12` → `W-17`/`W-14` → `W-19` → `W-20`)" | Ordered preconditions | No canonical `D-4.n`; proposal §18 dependency matrix | Consistent, additive condition |

**Findings.**

- **F1 — Approval act is unambiguous and verified.** Both repositories agree that the owner approved
  `D-4.1`–`D-4.7` on 2026-11-23 via `approve_all_d4`, and that the approval is a design/sequencing gate,
  not implementation authority.
- **F2 — No substantive conflict.** Every IRR §2 statement is compatible with Option C and with each
  canonical decision; none permits blending, silent fallback, PIT product use, or fabricated freshness.
- **F3 — Numbering and citation diverge (see `D4-DR-01`).** The IRR record's `D-4.2`–`D-4.7` labels are
  not the canonical decision identities, and it states that §11–§12 were "accepted verbatim" although in
  the proposal §11 = "Failure and Fallback Behaviour" and §12 = "Freshness Policy", while the decision list
  is §20 and the decision text is §7.
- **F4 — Two canonical decisions are not restated in IRR §2**: `D-4.2` (explicit source selection /
  no fallback / no blending) and `D-4.3` (truthful D02 freshness) appear only obliquely; canonical `D-4.6`
  (`D01`/`D02` identity symmetry) does not appear at all. They are nonetheless *approved* — the owner
  approved the proposal as written — and IPD adopts them from §7/§20 as canonical. The omission is a
  documentation defect in the IRR acceptance record, not a gap in the approval.
- **F5 — IPD is not a passive mirror of IRR claims.** Three IPD-side facts asserted or implied by IRR
  records were checked directly and one required correction (`D4-DR-02`).

Because the canonical wording is what the owner approved, IPD's mirror acceptance binds to proposal §7/§20
and records the IRR §2 statements as **supplementary conditions** (`F3` items 4–7). This is a resolution,
not an override: no IRR-approved statement is dropped, and no canonical decision is renumbered.

---

## 5. Discrepancy register (identified, bounded, owned)

### `D4-DR-01` — IRR acceptance record renumbers the sub-decisions and mis-cites the proposal sections

- **Observed:** IRR acceptance §2 assigns `D-4.1`–`D-4.7` to statements that are not the canonical
  decisions, and cites "§11–§12 … accepted verbatim" (proposal §11 = failure/fallback behaviour, §12 =
  freshness policy). Canonical `D-4.2`, `D-4.3` and `D-4.6` are not restated as decisions.
- **Effect:** An auditor reading only the IRR acceptance record could conclude that no decision governs
  silent fallback, truthful D02 freshness, or `D01`/`D02` identity symmetry. That is a traceability defect
  in an otherwise valid acceptance.
- **Resolution adopted in IPD:** canonical numbering per proposal §7/§20 is authoritative here; the IRR §2
  items are preserved as supplementary conditions mapped in §4. Nothing in IPD's acceptance depends on the
  IRR numbering.
- **Corrective action required (outside IPD's write authority):** IRR-side erratum to (i) correct the §2
  numbering to the canonical `D-4.1`–`D-4.7` identities, (ii) cite §7 and §20 instead of §11–§12, and
  (iii) restate canonical `D-4.2`, `D-4.3` and `D-4.6`.
- **Owner:** IRR (Programme Authority / IRR document owner). **Blocking? No** — reported, not resolved, by
  explicit decision recorded here.

### `D4-DR-02` — Canonical `D-4.6`'s "4,584 `PROPOSED` rows" premise does not match committed IPD evidence

- **Observed in IRR** (proposal §7 `D-4.6`, §20 item 6, §18): the `4,584` W-27 net additions
  (`4,680 − 96`) "remain `PROPOSED` (unloaded by daemon)" until parity and `W-14` `E4` qualification
  complete.
- **Observed in IPD at `84e988b` (verified by parsing the committed manifests):**
  `evidence/dhan-w27/expansion-manifest.json` reports `counts.proposedAdditions: 0`,
  `alreadyQualified: 4680`, `countsByDisposition.PROPOSED_ADDITION: 0`;
  `evidence/dhan-p7/qualification-report.md` reports `QUALIFIED: 4680` and `registry size: 4680`; and the
  runtime loader (`loadGovernedP7InstrumentRegistry`, used by the daemon) reads
  `disposition === 'QUALIFIED'` only. The `4,584` are therefore the net additions that are **already
  statically qualified and registered**, not inert `PROPOSED` rows; what they have never had is **live**
  qualification — emitted envelopes carry `providerQualification: 'SYNTHETIC_ONLY_NOT_LIVE_QUALIFIED'`.
  Open IPD PR #190 independently reaches the same conclusion (the 96-row sample was a pre-2026-11-15 P7
  revision; the tracked manifest was regenerated and holds 4,680 `QUALIFIED` rows) — cited as corroboration
  only, since it is unmerged.
- **Effect:** the decision's *requirement* (exact identity, no symbol/fuzzy matching, no promotion without
  parity + `E4`) is unaffected and remains governing; only its *description* of the current state is wrong.
  The practical risk is a false belief that those mappings are unreachable: they are reachable for static
  identity resolution, but none has live vendor-qualified evidence.
- **Resolution adopted in IPD:** IPD records the verified figures and will continue to treat "qualified" as
  static instrument-master evidence only, never as live qualification.
- **Corrective action required:** IRR to amend the `4,584 PROPOSED` wording (or record the distinction
  between static qualification and live qualification) in the acceptance/proposal trail.
- **Owner:** IRR (text) with IPD (evidence). **Blocking? No.**

### `D4-DR-03` — PIT store description ("20-record runtime fixture store") is IRR-specific

- **Observed:** IRR acceptance §2 `D-4.1` describes `D114/PIT` as a "20-record runtime fixture store".
  That describes the fixture-backed PIT used by IRR's `/api/pit/market-data`, not IPD's boundary.
- **Observed in IPD:** non-production population is three archived Bhavcopy fixtures
  (`NON_PRODUCTION_D114_ARCHIVES`: 2024-06-28 legacy, 2026-01-05 and 2026-02-10 UDiFF) through
  `./d114-non-production`, and IPD additionally holds a durable append-only PIT store used by library
  consumers, with no HTTP route.
- **Effect:** neither claim is false in its own repository, but the sentence, read as an IPD fact, is
  misleading; and canonical `D-4.5`'s "durable storage" prerequisite is partially satisfied at IPD library
  level without any admission.
- **Resolution adopted in IPD:** recorded here; IPD claims no admission and no product route.
- **Owner:** IRR (wording). **Blocking? No.**

---

## 6. IPD obligations and gating (what this acceptance does *not* do)

| # | Obligation / precondition | Owner | Gate that it blocks | Current status |
|---|---|---|---|---|
| 1 | `W-19` — wire the D02 historical cache/orchestrator so `providerResponseTimestamp`, `retrievalTimestamp` and `cacheTimestamp` are produced and D02 freshness can become `CURRENT`/`STALE` truthfully | IPD | IRR `W-20` | OPEN — D02 freshness is honestly `NOT_AVAILABLE`/`UNKNOWN` today |
| 2 | `D01`/`D02` boundary identity symmetry (require `exchangeSegment` + canonical `securityId` for historical requests) | IPD | IRR `W-20` (per `D-4.6`'s "at minimum … when `W-20` activates") | OPEN — safety enforced by `AMBIGUOUS_MAPPING`, boundary symmetry not yet enforced |
| 3 | D02 series-level provenance digest (`dataVersion` / `lineageHash`) to complete `HistoricalPriceEvidence` | IPD | `D-4.7` reproducible embedding for D02-sourced reports | OPEN — D01 carries it, D02 does not |
| 4 | Impossible-date guard in `validateDhanHistoricalRequest` (`2026-02-30` currently passes when `toDate` is late enough) | IPD | Bounded `E4` historical probe readiness | OPEN — reproduced in §7.5 |
| 5 | Bounded single-request `E4` historical qualification probe (wire type of `securityId`, vendor `interval` spelling, `/charts/intraday` gap `G-12`, `toDate` exclusivity, `isAdjusted` policy) | Operator + owner authorization | `W-12` completion → `W-14`/`W-17` → `W-19` → `W-20` | NOT AUTHORIZED |
| 6 | IRR pin advance beyond `26855625` (at least `9d5ffa4`/`84e988b`) before any D02 consumer work | IRR | `W-20` | NOT DONE (IRR pin is `26855625`; `84e988b` is its descendant) |
| 7 | IRR-side erratum for `D4-DR-01` / `D4-DR-02` wording | IRR | Audit traceability only | OPEN — reported here |

---

## 7. Validation performed for this record

Environment: local sandbox, Node v22.22.3, npm 10.9.8, IPD `main` `84e988b` + this branch, IRR clone of
`main` `8f893112`. No live Dhan request, credential access, daemon start or network egress to the vendor
occurred.

### 7.1 IPD documentation/governance checks

| Command | Result |
|---|---|
| `npx tsc --noEmit` | **PASS** (exit 0, no diagnostics) |
| `npm run build` (`tsc` + `vite build` + portfolio-ui/pit/dhan package builds) | **PASS** |
| `npm test` (guarded runner, CV-35) | **PASS** — 2154 executed, 2140 passed, 14 skipped, 0 failed (`[test-guard] OK`) |
| `npm run test:package-consumer` | **PASS** — packed public subpaths verified; strict typecheck `PASS`; browser bundle `forbiddenHits: []` |
| Referenced-path resolution for this record (`IRR:`-prefixed paths are IRR-repository paths, all others IPD) | **PASS** — every IPD path exists at `84e988b`; every `IRR:` path resolves in the IRR clone at `b9d6c2f`/`8f893112` |

### 7.2 IRR acceptance provenance checks

| Check | Result |
|---|---|
| `git log -1 8f893112` (IRR `main`) | Merge of PR #627; parent `b9d6c2f` |
| `git rev-parse b9d6c2f:…/DHAN-D4-OWNER-ACCEPTANCE-2026-11-23.md` | `6677945c936df4f39e541d496dbec9f811fbf051`, identical at `main` (acceptance text unaltered by merge) |
| `sha256sum` of acceptance / proposal / assessment / W-12 record | `b066a9e3…dedcad` / `84e76438…66e86` / `48b1f8f1…cd767` / `a6c47381…2c50` |
| PR #627 body and merge metadata | `MERGED` 2026-11-23T17:25:21Z, merge commit `8f893112…` |

### 7.3 Cross-repository consistency checks

| Check | Result |
|---|---|
| `git merge-base --is-ancestor 2685562 84e988b` (IPD) | **TRUE** — IRR's IPD pin is contained in IPD `main` |
| Canonical decision list (proposal §7, §20) vs acceptance §2 | 7 canonical decisions present in the approved proposal; 3 canonical decisions not restated in acceptance §2 (reported as `D4-DR-01`) |
| Option C limbs vs IPD routes/packages | Consistent (§3) |
| IPD W-27/P7 figures vs IRR "4,584 PROPOSED" premise | **Mismatch** (reported as `D4-DR-02`) |
| IPD CI at `84e988b` | `typecheck · build · test` = `success`; `executed test count` = `success` |

### 7.4 IPD current-state evidence (committed artifacts)

- `evidence/dhan-w27/expansion-manifest.json`: `inputRows 217104`, `proposedAdditions 0`,
  `alreadyQualified 4680`, `rejected 212424`, `outOfScope 193340`, `reconciles: true`;
  `baseline.qualifiedMappings 4680`, `baseline.distinctCompanies 2390`.
- `evidence/dhan-p7/qualification-report.md`: `QUALIFIED: 4680`, `registry size: 4680`,
  coverage `BSE:A 700 / BSE:B 1590 / NSE:EQ 2390`; "Static instrument-master evidence only: no live quote
  qualification, no production readiness claim."
- `docs/IPD-P5-FRESHNESS-HTTP.md`: `D02_OHLCV` returns `cacheState: NOT_AVAILABLE`, unknown verdict;
  D01 threshold 900 s, D02 threshold 86 400 s.

### 7.5 Executed behavioural probes (offline, against the built `dist` of this branch)

| Probe | Observed result | Decision it evidences |
|---|---|---|
| `MarketDataTransportClient.getQuote({companyId})` | `MALFORMED_REQUEST` — "quotes require companyId and a canonical D114 securityIdentity (ISIN:<isin>:<series>)" | `D-4.6` (D01 boundary) |
| `MarketDataTransportClient.getHistorical({companyId,…})` | request accepted, transport attempted (no server in sandbox) | `D-4.6` (D02 boundary asymmetry) |
| `validateDhanHistoricalRequest({companyId,…})` with no `exchangeSegment`/`isin` | `{ok:true, spanDays:31}` | `D-4.6` (partial) |
| `validateDhanHistoricalRequest` `fromDate 2026-02-30`, `toDate 2026-03-05` | `{ok:true, spanDays:4}` (impossible date accepted) | §6 item 4 |
| `validateDhanHistoricalRequest` `2020-01-01 … 2026-01-31` | rejected: "window of 2223 days exceeds … 1825 days" | `D-4.2`/`D-4.3` bounds intact |
| `buildDhanHistoricalRequestBody` (`1D`) | `{"securityId":"2885",…,"toDate":"2026-09-24"}` (string id; +1 day exclusive end) | `D-4.6`, `W-12` gap |
| `buildDhanHistoricalRequestBody` (`1m`) | `toDate` unchanged `2026-09-23` | `W-12` gap (intraday) |
| `freshnessStatus('D02_OHLCV', null, …)` | `cacheState NOT_AVAILABLE`, `verdict UNKNOWN`, `timestampEvidence NOT_AVAILABLE`, `eligibleForUse false`, `suppressExecution true` | `D-4.3` |
| `buildD114SecurityIdentity('INE002A01018','EQ')` | `ISIN:INE002A01018:EQ`, `isinAuthority NON_AUTHORITATIVE` | identity grammar used above |

---

## 8. Non-claims and boundaries

- **Documentation only.** This change adds one record. It contains no source, test, contract, configuration,
  credential, provider, schema or migration change, and no runtime behaviour is altered.
- **No live egress.** No Dhan quote or `/charts/historical` request was made, no credential was read, and no
  daemon was started for this record.
- **No implementation authority.** `D-4` acceptance does not authorize `W-19`, `W-20`, `W-39`, `W-32`,
  `W-33`, any `E4` burst, any PIT product surface, or any adjustment modelling.
- **No admission.** Nothing here admits D114/PIT to production, supersedes `B2`/`CV-32`, or constitutes
  Stage 5 acceptance, release readiness or deployment.
- **No cross-repository write.** IPD did not modify IRR; `D4-DR-01` and `D4-DR-02` are reported for IRR to
  correct, and IPD's acceptance does not depend on their correction.
- **No repaired claim.** Where IPD's committed state differs from an IRR description, IPD records its own
  verified state and reports the difference rather than restating the IRR figure.

---

## 9. Updated D-4 status and next roadmap step

**D-4 status: `OWNER-APPROVED (2026-11-23) · IRR ACCEPTED (b9d6c2f, merged 8f893112) · IPD MIRROR ACCEPTED
(this record) · W-20 BLOCKED`.**

- All seven decisions `D-4.1`–`D-4.7` are represented, approved and mirrored; IPD's own obligations are
  named in §6.
- IPD mirror acceptance status: **COMPLETE**, with three reported discrepancies (`D4-DR-01`…`03`) and no
  blocker to the acceptance itself.
- **Next roadmap step (Phase 0 → `W-12`):** complete **`W-12` historical request-builder qualification**.
  The builder is verified unmodified by PR #176 (string `securityId`, provisional intervals, every interval
  routed to `/charts/historical`), so the remaining `W-12` work is a **bounded, separately owner-authorized
  single-request `E4` historical schema qualification** to settle: `securityId` wire type, vendor interval
  spelling, `/charts/intraday` (`G-12`), `toDate` exclusivity, and live `isAdjusted`/timestamp semantics.
  IPD prerequisites to fix first are §6 items 1–4. After `W-12`, sequencing is `W-17`/`W-14` → `W-19` (IPD) →
  `W-20` (IRR), exactly as `D-4.7`'s sequencing condition requires.

---

## 10. Publication and independent verification

- Branch: `arena/c76ff83a-iips-production-market-data`; IPD publication commit: recorded in the follow-up
  commit that supplies this value (the record's first publication commit is the parent of that commit).
- Verify the approval act itself:
  `git -C <irr-clone> show 8f893112:docs/integration/DHAN-D4-OWNER-ACCEPTANCE-2026-11-23.md`
- Verify the canonical wording:
  `git -C <irr-clone> show b9d6c2f:docs/integration/DHAN-D4-OWNER-DECISION-PROPOSAL-2026-11-23.md` (§7, §20)
- Verify this record's history:
  `git log --oneline -- docs/integration/D-4-D02-D114-PIT-MIRROR-ACCEPTANCE-2026-11-23.md`
- Verify the IPD facts: `node scripts/dhan-w27-expand.mjs --check` (if present in a later revision) or the
  committed manifests cited in §7.4; probes in §7.5 re-run against `dist/` after `npm run build`.
