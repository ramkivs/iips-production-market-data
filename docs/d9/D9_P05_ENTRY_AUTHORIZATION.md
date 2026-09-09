# D9 — P05 ENTRY / EXPLICIT AUTHORIZATION

**Authority of record:** Sai/Ramki — program owner of record (D8 convention:
*"consider this as decision approved by Sai/Ramki to move forward"*).
⚠ Roles **A1–A4 remain cleared, not person-assigned** (`person_named: false`, D8 §1 row 3).

**Authoritative baseline:** `efe33eae287d2181cfdd5a838b0d9e5112fcdad3`
— *"CHECKPOINT-03: post-P04 / OI-10 resolved / pre-P05 boundary"*
(tree OID `a11ea8646b9025c2fe58ca7466bb910e7dc5fdef`).

**P05 entry/authorization state: `NOT_AUTHORIZED` → `ENTRY_AUTHORIZED`.**

> ## ⚠ THIS DOCUMENT GRANTS NO CERTIFICATION, ACCEPTS NO GATE, AND AUTHORIZES NO
> ## PRODUCTION ACTIVATION.
>
> **P05 ENTRY/AUTHORIZATION = AUTHORIZED · P05 ACCEPTANCE = NOT_ACCEPTED ·
> CERTIFICATION = NONE_GRANTED · PRODUCTION ACTIVATION = NOT_AUTHORIZED.**
>
> These four states are distinct and are **not** collapsed. Entering P05 is not passing it.

---

## 1. Precondition verification — all 15 PASS

Recorded before the decision, per the standing rule that a precondition table is evidence,
not authorization. Verification detail: `docs/d9/D9_EVIDENCE_NOTES.md`.

| # | Precondition | Result | Evidence |
|---|---|---|---|
| 1 | HEAD is exactly `efe33ea…dcdad3` | **PASS** | `git rev-parse HEAD` |
| 2 | Working tree clean — 0 untracked, 0 staged, 0 unstaged | **PASS** | `git status --porcelain` empty; tracked 95 |
| 3 | HEAD tree OID = `efe33ea` tree OID | **PASS** | both `a11ea8646b9025c2fe58ca7466bb910e7dc5fdef` |
| 4 | P00, P01, P02, P03, P04 all ACCEPTED | **PASS** | `\| **Result** \| # **ACCEPTED** \|` in all five `P0{0..4}_GATE_ACCEPTANCE.md` |
| 5 | CHECKPOINT-03 authoritative; Checkpoint Gate 1 passed | **PASS** ⚠ see §1.1 | `docs/CHECKPOINT-03.md` present, blob `0058bcfad54143c91e1418a2a6c585839fbee202` |
| 6 | P05 Entry Assessment = **ENTRY READY — EXPLICIT AUTHORIZATION REQUIRED** | **PASS** | Track B assessment of 2026-09-09; `CHECKPOINT-03.md`:160,162,166 |
| 7 | All applicable P05 entry preconditions satisfied | **PASS** | 20 of 20 applicable conditions SATISFIED · 0 hard entry blockers |
| 8 | OI-10 RESOLVED — token `MD:`, form `MD:<domain>.<field>` | **PASS** | `CHECKPOINT-03.md`:75–77 |
| 9 | OI-08 RESOLVED = **1:N** | **PASS** | `CHECKPOINT-03.md`:137 |
| 10 | OI-09 RESOLVED = **FIGI / OpenFIGI** | **PASS** | `CHECKPOINT-03.md`:138 |
| 11 | ADR-01 **C1–C6 unchanged** | **PASS** | **6 of 6** rows `UNCHANGED` — `CHECKPOINT-03.md` §3.2 |
| 12 | No `P05_GATE_ACCEPTANCE.md` exists | **PASS** | `find docs -name 'P05_GATE_ACCEPTANCE.md'` → 0 |
| 13 | No P05 implementation artifacts / executable-source files | **PASS** | `docs/p05` absent · 0 `P05*` files · 0 tracked executables · 0 executables in tree |
| 14 | P06 / P07 / P08 untouched | **PASS** | all three directories absent · 0 tracked · 0 named artifacts |
| 15 | OI-P04-04 OPEN · OI-P04-03 OPEN | **PASS** | `P04_OPEN_ITEMS.md`:61,72 — **neither resolved here** |

### 1.1 ⚠ Disclosure on precondition 5

`CHECKPOINT-03.md` is present, authoritative and byte-exact — that half is verified in-repo.
**Track B Checkpoint Gate 1's PASS result is not itself a committed artifact**: it was reported
in the Track B session of 2026-09-09 (all 10 controls PASS at `efe33ea`) and, deliberately, no
competing checkpoint record was created because `CHECKPOINT-03.md` already existed
authoritatively. **This document is therefore the first committed record of that result.** It is
recorded here as provenance, by addition, and no historical record was rewritten to produce it.

---

## 2. AUTHORITY DECISION OF RECORD

| Field | Content |
|---|---|
| **Decision** | **P05 — Market Data Acquisition & Ingestion is ENTERED / AUTHORIZED.** |
| **Authority** | **Sai/Ramki** — program owner of record. ⚠ No individual beyond the established authority of record is named or inferred |
| **Decision date** | **2026-09-09** (Track B governance session) |
| **Recorded (UTC)** | **2026-09-09T12:29:00Z** · Asia/Calcutta `2026-09-09T17:59:00+0530` |
| **Recorded against baseline** | **`efe33eae287d2181cfdd5a838b0d9e5112fcdad3`** — *"CHECKPOINT-03: post-P04 / OI-10 resolved / pre-P05 boundary"* |
| **Instrument** | This document, `docs/d9/D9_STATUS.json`, `docs/d9/D9_EVIDENCE_NOTES.md` |
| **Basis** | P05 entry preconditions MET (`CHECKPOINT-03.md` §5.1) + P05 Entry Assessment **ENTRY READY — EXPLICIT AUTHORIZATION REQUIRED** (0 hard entry blockers) |
| **Does NOT confer** | Gate acceptance · certification · production activation · provider selection · credentials · resolution of any open item |

---

## 3. What is authorized — exact scope

**Scope is exactly as approved. It is not expanded by implication, and nothing outside §3 is
authorized by this document.**

| # | Authorized | Scope detail | Tracker anchor |
|---|---|---|---|
| **A-1** | **P05-01 — Local deterministic market feed** | Full acquisition work: **specification** · **adapter conformance** · **fixture** design and construction · **provenance / `asOf` / version** handling · **deterministic replay and idempotency** · **negative and error-contract** work (P02 E1–E8) | `P05-01` dep `P02-01,P04-01` · readiness *"Provider contract + master"* · evidence *"Repeat-run tests"*, *"Fixture dataset"* |
| **A-2** | **P05 specification / adapter-contract work for P05-02** | **Specification and adapter-contract only** — contract shape, conformance rules, entitlement/secret *requirements*, error taxonomy mapping, observability requirements. ⚠ **No live provider execution** | `P05-02` dep `P02-01,P02-02,P03-01,P04-02` |
| **A-3** | **P05 specification / adapter-contract work for P05-03** | **Specification and adapter-contract only** — historical OHLCV ingestion contract, reproducibility and load/reconcile requirements. ⚠ **No licensed or deeper historical acquisition** | `P05-03` dep `P05-01,P04-02` |

### 3.1 Explicitly NOT within this authorization

| # | Not authorized | Constraining authority / item |
|---|---|---|
| **N-1** | **P05-02 live provider execution** | **Provider selection** (NONE MADE) · **entitlement** (matrix **EMPTY**, INV-10) · **credentials** (NONE; P03 is specification only) · **connectivity** · **P16 / provider-entitlement authority** |
| **N-2** | **P05-03 licensed / deeper historical acquisition** | **OI-P04-04** — FIGI source availability, licensing and coverage — and its entitlement/coverage disposition |
| **N-3** | **P05-04 ingestion orchestration build-out** | Not included in the approved scope. Depends on `P05-01,P05-02`; requires a further explicit act |
| **N-4** | **Per-record tenant/region governance application** | **OI-P04-03** OPEN — bounded by **IB-1…IB-5** (`P04_GATE_ACCEPTANCE.md` §4.2). ⚠ Lifting IB-1 requires an **explicit A1 act** |
| **N-5** | **Inventing, inferring or defaulting the tenant/region attribute set** | **IB-2** — recording an open item is not resolving it |
| **N-6** | **Inventing remaining domain-segment labels** | See **OI-D9-01** (§6) — labels are enumerated by authority, not derived |
| **N-7** | **`<NS>` → `MD:` rewriting of accepted P01/P02 artifacts** | `CHECKPOINT-03.md` §3.3 item 5 and recovery rule 14 — those records stand; the binding applies to **new** work |

---

## 4. Carried-forward P04 / OI-10 constraints — unchanged and binding

| # | Constraint | Source |
|---|---|---|
| **1** | **Exact namespace token is `MD:`; canonical form `MD:<domain>.<field>`.** Namespace is **mandatory** for market-data canonical field keys. ⚠ Not to be re-derived, re-recommended, re-opened or replaced | `CHECKPOINT-03.md` §3, recovery rule 10 |
| **2** | **ADR-01 C1–C6 unchanged** — partition · reverse partition · intersection · cross-snapshot · **fail-closed abort** · deterministic merge order | `CHECKPOINT-03.md` §3.2 (6 of 6 `UNCHANGED`) |
| **3** | **OI-08 = 1:N** — one canonical company/entity identity to N securities/instruments/listings; `companyId` remains the CSIP join key and is **not** redefined, removed or retyped | `CHECKPOINT-03.md`:137 · CD-1…CD-7, MC-1…MC-7 |
| **4** | **OI-09 = FIGI/OpenFIGI** authoritative; canonical ID remains **distinct from** FIGI; ISIN/CUSIP/SEDOL non-authoritative; provider-native IDs and symbols are **never** canonical identity | `CHECKPOINT-03.md`:138 · XI-1…XI-8 |
| **5** | **Unmapped canonical identity MUST fail explicitly** — no silent coercion, no placeholder, no synthesised `companyId`, no empty string, no `null` join key. **Absent FIGI ⇒ explicit unresolved state, never a fallback** | FC-1…FC-7 · XI-6, V-X5 |
| **6** | **`snapshotId` remains `data-${provider}-${dataVersion}-${asOf}`** (INV-2). P04/P05 add **no component** to it | SN-1, SN-3 · `P01_VALIDATION_RULES.md` ST-2 |
| **7** | **`identityMappingVersion` lives in lineage, not in `snapshotId`** | SN-2 (INV-4, P02 SI-4/SI-5) |
| **8** | **Never conflate with engine `SNAP_*`** — two identifiers, two layers, both preserved; no third identity layer | SN-4, SN-5 (SI-1/SI-2, AD-6) |
| **9** | **Six lineage axes — no seventh** | VA-1 (INV-3) |
| **10** | **Venue identity is MIC-based**; operating MIC and segment MIC never interchangeable | VN-1, VN-3 · `P01_IDENTITY_AND_LINEAGE` §1.2 |
| **11** | **Lifecycle state is effective-dated; a transition never mutates the canonical security ID** | LC-1, LC-2 (CS-5) · ED-1…ED-7 |
| **12** | **Sole production ingress `MarketDataSource<T>` → `DataSnapshot<T>`**; `DataBoundExecutor` the sole engine-binding path | AD-2 · `CHECKPOINT-03.md` §5.3 row 8 |
| **13** | **Provider-native payloads stay inside adapters**; no provider-native shape leakage; error taxonomy **E1–E8** | `CHECKPOINT-03.md` §5.3 row 9 · P02 |
| **14** | **AD-17 replay firewall preserved** — `ReplayService`, `DataBoundExecutor`, `LiveDataRuntime.ts` **untouched** | AF-1…AF-5 · recovery rule 13 |
| **15** | **Existing-IIPS is read-only** — `NormalizedHolding`/`companyId`, `OntologyMapper`, `RankingEngine`, sector taxonomy, E2E-030 artifacts. **Map onto, never redefine** | `P04_DEPENDENCY_REGISTER.md` §5 · CG-4, TX-1/TX-2 |
| **16** | **DO-P04-1…DO-P04-5 and DO-1…DO-5 remain DEFERRED — NOT PASSED.** This authorization discharges none of them | `P04_OPEN_ITEMS.md` §3 |
| **17** | **M-1/AD-4 · M-5 · M-6 · AD-17/M-2 remain open existing-IIPS items** — not repaired, revalidated or waived here | `P04_DEPENDENCY_REGISTER.md` §3 |

---

## 5. Explicit exclusions from this authorization

**This authorization does NOT:**

| # | Exclusion |
|---|---|
| 1 | Constitute **P05 acceptance** |
| 2 | Create **`P05_GATE_ACCEPTANCE.md`** |
| 3 | Grant any **certification** — **C1–C12 remain `NONE_GRANTED`** |
| 4 | Authorize **production activation** — remains **`NOT_AUTHORIZED`** |
| 5 | Authorize **P06, P07 or P08** in any respect |
| 6 | Resolve **OI-P04-04** (FIGI sourcing / licensing / coverage) |
| 7 | Resolve **OI-P04-03** (tenant/region governance attribute set) |
| 8 | **Select a market-data provider** |
| 9 | **Provision credentials** or expose any secret material |
| 10 | **Rewrite historical P01/P02 namespace artifacts** |
| 11 | Alter **OI-08** |
| 12 | Alter **OI-09** |
| 13 | Alter **OI-10** |
| 14 | Alter **ADR-01 C1–C6** |
| 15 | Modify **existing-IIPS** source, methodology, scoring or certification behaviour |
| 16 | Promote any downstream gate, or accept any gate — **no automatic promotion** |
| 17 | Modify the **tracker XLSX or SPEC DOCX** (AD-14 corrections remain specified, not applied) |

---

## 6. Newly recorded open item — OI-D9-01

> ⚠ **This identifier is new. No prior authoritative item bore it.** It is recorded here by
> addition; nothing is resolved by being recorded (decision-log rule 5).

| Field | Content |
|---|---|
| **Item** | **OI-D9-01 — enumeration of `MD:<domain>.<field>` domain-segment labels** |
| **Observed state** | The authoritative corpus exemplifies **five** domain-segment labels — `MD:price`, `MD:ohlcv`, `MD:valuation`, `MD:fundamentals`, `MD:estimates` — against a **ten-domain** baseline (`D4_02_DATA_DOMAINS.md`: D01 Market prices/quotes · D02 Historical OHLCV · D03 Fundamentals · D04 Corporate actions · D05 Instrument/security master · D06 News/events · D07 Analyst estimates/consensus · D08 Macroeconomic data · D09 Alternative data · D10 Exchange/reference metadata) |
| **Gap** | No domain-segment label is exemplified for **D04, D05, D06, D08, D09, D10** |
| **Owner** | **Ramki/Sai** — program authority. ⚠ **No label is invented, inferred or defaulted here** |
| **Blocks P05 entry?** | **NO** — entry is authorized by this document |
| **Blocks P05-01?** | **NO** — P05-01 is D01/D02 deterministic local work; both labels are exemplified |
| **Blocks other P05 work?** | Only where a **new** domain-segment label must first be minted |
| **Note** | The token and the **form** are settled (`MD:` / `MD:<domain>.<field>`); only the per-domain **label vocabulary** is incomplete. This is a vocabulary decision, not a token decision — **OI-10 is not reopened** |

### 6.1 ⚠ CORRECTION BY ADDITION — 2026-09-09, recorded by the P05-01 execution

> **The table above is left UNEDITED as the record of its own moment.** This subsection
> supersedes it **as to current state only**, per the additive/supersession convention used
> throughout this corpus (the `8` → `8a` → `8b` → `8c` pattern) and `P00_DECISION_LOG.md`
> rule 1 (*"Entries are append-only. Superseding a decision requires a new entry citing the
> prior one."*).

| Field | Corrected content |
|---|---|
| **Corrected state** | **OI-D9-01 RESOLVED BY EVIDENCE — no gap exists** |
| **What was wrong** | The "Observed state" and "Gap" rows above are **factually incorrect**. They were derived by counting **literal `MD:` strings** in the corpus. The accepted field dictionary predates the OI-10 recording and therefore writes its keys with the **`<NS>` placeholder** (`<NS>corpaction.actionType`, `<NS>news.headline`, `<NS>macro.value`, …), so those labels are present and authoritative but contain no `MD:` substring |
| **Evidence** | `docs/p01/P01_FIELD_DICTIONARY.md` §3–§12 — an **ACCEPTED** artifact (`docs/p01/P01_GATE_ACCEPTANCE.md`:16 `**ACCEPTED**`). Parsed directly: **D01** `price`,`valuation` · **D02** `ohlcv` · **D03** `fundamentals` · **D04** `corpaction` · **D05** `identity` · **D06** `news` · **D07** `estimates` · **D08** `macro` · **D09** `alt` · **D10** `venue` |
| **Coverage** | **10 of 10 domains have a segment. Domains with no segment: NONE.** Distinct segments: **11** (D01 carries two) |
| **Why the substitution is legitimate** | `CHECKPOINT-03.md` §3.3(5) and recovery rule 14 bind `<NS>` → **`MD:`** for **new** P05/P06 work; §10 states recording the token later is *"a substitution, not a redesign."* Applying it to the accepted dictionary is **applying the accepted contract**, not inventing vocabulary |
| **Vocabulary invented or altered** | **NO** — every segment is read verbatim out of the accepted dictionary |
| **OI-10 reopened or redesigned** | **NO** — token **`MD:`** and form **`MD:<domain>.<field>`** are preserved exactly; `namespaceVersion` `1.0` |
| **Enforced mechanically** | `p05/tests/namespace.test.js` parses the dictionary and asserts the implementation vocabulary **equals** the dictionary's set exactly — so "no invented label" is a verified property, not a claim |
| **Full record** | `docs/p05/P05_01_OPEN_ITEMS.md` §2 |

⚠ **Recording an open item does not resolve it — and neither does correcting one.** This
correction closes **OI-D9-01 only**. **OI-P04-04** and **OI-P04-03** remain **OPEN** and are
untouched by it.

---

## 7. P05 status transition — recorded without collapse

```
CHECKPOINT-03  ──►  P05 ENTRY PRECONDITIONS MET
                              │
                              ▼
                    P05 ENTRY ASSESSMENT
              "ENTRY READY — EXPLICIT AUTHORIZATION REQUIRED"
                              │
                              ▼
              ▶ P05 ENTRY / AUTHORIZATION  =  AUTHORIZED   ◀── THIS DOCUMENT
                              │
                              ▼
                    P05 IMPLEMENTATION  (in progress may now begin,
                                         within §3 scope only)
                              │
                              ▼
                 P05 ACQUISITION GATE  =  NOT_ACCEPTED
                    (separate future act; requires named A3 acceptor
                     + the acceptance evidence package)
                              │
                              ▼
              CERTIFICATION = NONE_GRANTED  ·  ACTIVATION = NOT_AUTHORIZED
```

⚠ **These states are distinct and are not collapsed.** Being at *authorized* is not being at
*accepted*; nothing in this document reaches acceptance, certification or activation.

---

## 8. What must happen for P05 acceptance (recorded, not executed)

Acceptance remains a **separate future gate** requiring, at minimum: the `P05-01…P05-04`
tracker evidence (repeat-run tests + fixture dataset · authenticated ingestion + integration
tests + provider evidence · load/reconcile tests + historical sample · failure/replay tests +
run logs) · namespace C1–C6 conformance · identity/mapping CS·CD·MC·MP·PN·FC·XI conformance ·
lineage VA-1/SN-1…SN-5 conformance · lifecycle LC/ED and venue VN/BD conformance · P02
abstraction conformance · existing-IIPS non-regression (AF-1…AF-5, CG-4, NR-10) · disposition
of **OI-P04-04** · disposition of **IB-1** · and **an explicit acceptance act by a named A3 gate
acceptor** — ⚠ **A3 remains UNKNOWN**. *No automatic promotion.*

---

## 9. Recording integrity

| Check | Result |
|---|---|
| Baseline HEAD at time of recording | `efe33eae287d2181cfdd5a838b0d9e5112fcdad3` ✅ |
| Tree OID at time of recording | `a11ea8646b9025c2fe58ca7466bb910e7dc5fdef` ✅ |
| Working tree before recording | **clean** ✅ |
| Historical gate / decision records rewritten | **NONE** — all edits are additive ✅ |
| Gate-acceptance records modified (`P00…P04_GATE_ACCEPTANCE.md`) | **NONE** — all five unmodified ✅ |
| Existing files modified | **2**, both additively — `docs/PROGRAM_STATE.md` (recovery/index) and `docs/p00/P00_DECISION_LOG.md` (append-only log, extended per its own rule 1). ⚠ Two lines register as replacements, not pure insertions: the §7 heading (expanded to include D9) and the closing sentence *"This manifest records no new decision."* (**preserved verbatim**, then clarified). **Neither erased historical content** ✅ |
| `CHECKPOINT-03.md` modified | **NO** ✅ |
| Tracker XLSX / SPEC DOCX modified | **NO** ✅ |
| Executable / implementation files created | **NONE** ✅ |
| `P05_GATE_ACCEPTANCE.md` created | **NO** ✅ |
| Provider selected / credentials provisioned | **NO / NO** ✅ |
| OI-P04-04 / OI-P04-03 resolved | **NO / NO** ✅ |
| P06 / P07 / P08 artifacts created | **NONE** ✅ |
| Existing-IIPS modified | **NO** ✅ |
| Certification / activation state changed | **NO** — `NONE_GRANTED` / `NOT_AUTHORIZED` ✅ |
| Pushed | **NO** ✅ |
| Files created by this record | `docs/d9/D9_P05_ENTRY_AUTHORIZATION.md` · `docs/d9/D9_STATUS.json` · `docs/d9/D9_EVIDENCE_NOTES.md` |
| Files updated by this record (additively) | `docs/PROGRAM_STATE.md` · `docs/p00/P00_DECISION_LOG.md` |

---

**D9 — P05 ENTRY / EXPLICIT AUTHORIZATION RECORDED.**
**P05 ENTRY/AUTHORIZATION = AUTHORIZED · P05 ACCEPTANCE = NOT_ACCEPTED ·
CERTIFICATION = NONE_GRANTED · PRODUCTION ACTIVATION = NOT_AUTHORIZED.**
**Recorded against `efe33ea` · 2026-09-09 · Sai/Ramki, program owner of record.**
