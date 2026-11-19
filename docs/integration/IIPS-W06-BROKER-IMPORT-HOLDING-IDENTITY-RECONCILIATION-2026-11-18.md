# W06 — Broker Import and Holding Identity Reconciliation (2026-11-18)

**Question answered:** the Broker Import of 10–11 November reported 64/64 holdings persisted, while
W04 reported only 1 of 64 with a stored security identity. **These two statements are both correct and
do not contradict each other. They measure two different identity layers.** No identity was lost, and
no import failed.

**What this record adds:** the reconciliation across all 64 holdings, the code-level cause, and the
correct starting point for W06 coverage measurement.

**What this record does not do:** it repeats no Broker Import, reads no host, makes no database read or
write, assigns or repairs no identity, and changes no implementation. Every figure below comes from
evidence already committed to this repository.

---

## 1. Executive finding

The Broker Import and W04 report on two separate fields that are populated by two separate code paths:

| Layer | Field | Set by | Meaning | Result on revision 1 |
| --- | --- | --- | --- | --- |
| **1. Company identity (import gate)** | `identityStatus`, `resolutionDisposition`, `companyId` | `resolveHoldings` → `createGovernedBrokerObservationResolver()` | The row's ISIN was matched to **one governed P04 company**. The whole import is refused unless *every* row passes. | **64 of 64 `RESOLVED` / `CANONICAL_P04`** |
| **2. Security identity (additive)** | `securityIdentity` (D114 `ISIN:<isin>:<series>`) | `mapBrokerImportHoldings` → `qualifyHoldingSecurityIdentity()` | The row has an exact **security-level** identity, which additionally needs P7 series evidence. Failure does **not** block persistence. | **1 populated, 63 `NULL`** |

- "**64/64 persisted**" is a Layer 1 statement: the import was accepted and 64 holdings were stored.
- "**1 of 64 with a stored security identity**" is a Layer 2 statement about a different column.

The code comment states the design intent explicitly: on qualification failure `securityIdentity` stays
null *"and the holding is still mapped and persisted (identity is additive, never blocks portfolio data)"*
(`src/persistence/brokerImportPersistence.ts`, lines 117–151).

The trap this record avoids is named in the earlier basis document
([D114 identity semantics](IIPS-CURRENT-PORTFOLIO-W04-P04-D114-IDENTITY-SEMANTICS-AND-COVERAGE-ACCEPTANCE-BASIS-2026-11-14.md), line 461):
counting P04 `RESOLVED` as security-identity success would report **64/64**, an unsupported 100% claim.
The correct security-level figure is **1 of 64**.

---

## 2. The five questions answered

### 2.1 What security identities were resolved during the original Broker Import?

**Company-level, all 64.** The exact-capture evidence records
`capture.identityStatus: {"RESOLVED":64}` and
`capture.resolutionDisposition: {"CANONICAL_P04":64}`
([E4 host run, §2](../../evidence/integration/w04-e4-original-csv-lineage-reproduction-2026-11-14/host-run-2026-11-14/w04-e4-csv-lineage-output.txt)).
Every row's ISIN matched one governed P04 company, which is a precondition for the import being
committed at all.

**Security-level, exactly 1.** The same capture records
`capture.identity.null: securityIdentity null on 63` and
`capture.identity.object: securityIdentity object on 1`.

### 2.2 Were those identities persisted against all 64 holdings in `DHAN_PORTFOLIO` revision 1?

**The company-layer identity: yes, all 64.** **The security-layer identity: only 1.**

The host inventory confirms both counts directly
([`portfolio-inventory-counts-2026-11-16.json`](../../evidence/integration/w04-evidence-reconciliation-2026-11-16/portfolio-inventory-counts-2026-11-16.json)):
`rows: 64`, `active: 64`, `securityIdentityPopulated: 1`, `securityIdentityNull: 63`, and the two
grouped rows both carry `identityStatus: RESOLVED` / `resolutionDisposition: CANONICAL_P04` — 63 with
`securityIdentityState: NULL`, 1 with `POPULATED`.

So the persisted revision genuinely holds `RESOLVED` company identity on 63 rows **whose
`securityIdentity` column is `NULL`**. That combination is the whole of the apparent inconsistency.

### 2.3 What identity fields are actually present in the persisted portfolio?

From the inventory archive (column-name evidence in
`06-provenance-and-unresolved-records.json`) and the persistence contract:

| Field | Present on | Value |
| --- | --- | --- |
| `company_id` (P04 company) | 64 of 64 | populated |
| `identity_status` | 64 of 64 | `RESOLVED` |
| `resolution_disposition` | 64 of 64 | `CANONICAL_P04` |
| `source_broker` | 64 of 64 | `DHAN` |
| `lineage_digest` | 64 of 64 | 64 distinct digests |
| **`security_identity` (D114)** | **1 of 64** | 1 object; **63 `NULL`** |
| ISIN, exchange (as import inputs) | 64 of 64 | embedded in each row's lineage/provenance digest |

### 2.4 Why did W04 report 63 holdings without stored identities?

Because it read the `security_identity` column, which is the **security-level** field. W04 was correct.

W04's own records already stated the reason split was unknown, and explicitly **rejected** the early
explanation that the broker export lacked identifiers
([W04 evidence reconciliation](IIPS-W04-EVIDENCE-RECONCILIATION-AND-ACCEPTANCE-ASSESSMENT-2026-11-16.md), §5 rows 1 and 2).
The E4 lineage reproduction settled the input question definitively:

- `csv.rows.identifiers: {"withIsin":64,"withoutIsin":0,...,"isinAndExchange":64}`
- `reproduction.reproduced: 64 of 64 stored lineage digests reproduced from the CSV, one-to-one`
- Exchange split at import: **NSE 63, BSE 1**

**So the identifiers were supplied, for all 64.** The identity was not stored at import.

**The cause, at code level:** `qualifyHoldingSecurityIdentity` returns `QUALIFIED` only if **eight**
conditions all hold
([`dhan_security_identity_service.ts`](../../src/providers/dhan/dhan_security_identity_service.ts), lines 100–113). Conditions 5 and 6 are:
*"P7 registry has an unambiguous mapping for (companyId, segment, ISIN)"* and *"P7 mapping carries a
canonical D114 securityId (series evidence)"*. The series is **never** supplied by the broker or by IRR;
it comes from the P7 registry. Where no unambiguous P7 mapping existed, the function returns
`UNRESOLVED` and the row is persisted with `securityIdentity` null.

The registry in force at import time held **96 mappings** (manifest `13bd2ef1…`,
[W04 reconciliation](IIPS-W04-EVIDENCE-RECONCILIATION-AND-ACCEPTANCE-ASSESSMENT-2026-11-16.md) line 199).
It now holds **4,680**, published 2026-11-15, and the Principal's host run of the published-manifest
qualification utility returned `ALL_64_MATCH_PUBLISHED_MANIFEST`
([roadmap](IIPS-CURRENT-PORTFOLIO-EXECUTION-ROADMAP.md) line 95). That is consistent with 1 of 64 having
P7 series evidence in the older, much smaller registry.

**Honest limit:** *which of the eight conditions failed for each of the 63 is not established, and cannot
be established from committed evidence*, because per-holding ISIN/symbol/series values were deliberately
sanitized out of every committed artifact (see §5). The registry-size hypothesis is the leading and
consistent explanation, not a host-proven one. The records already grade it as such
(`R` for the registry in force; `U` for which registry the host actually loaded).

### 2.5 Does W06 already have sufficient identity information to measure coverage across all 64 holdings?

**No. It has sufficient identity for 1 holding only.**

| Requirement for W06 | Have it? |
| --- | --- |
| Holding rows and count (denominator 64, all active) | **Yes** — host inventory |
| Company-level identity for every row | **Yes** — 64 of 64 `RESOLVED` |
| Exact security-level D114 identity (`ISIN:<isin>:<series>`) | **Only 1 of 64** |
| ISIN + exchange as *inputs* for the other 63 | **Yes, inside the revision** — recoverable from each row's lineage/provenance digest, proven by 64/64 reproduction |
| A *stored qualified* identity for the other 63 | **No** |
| A resolvable instrument (P7 → Dhan ID) for all 64 | **Yes in today's registry** (4,680 mappings, all 64 exact members) — but not in the stored revision |

The distinction that matters: for the 63, the **inputs needed to qualify** them are present in the
persisted revision, but the **qualified result** is not. Turning inputs into a stored qualified identity
requires **writing a new revision** (a later import). That is future import work — PR #163 is its
prerequisite — and is explicitly outside this work item.

---

## 3. Reconciliation table — all 64 holdings

Sources: holding rows from the committed E4 host run (§5 `[ROW]` lines), cross-checked against the host
inventory. `H01…H64` are the evidence's own sanitized holding ordinals; `G01…G64` are its sanitized CSV
holding ordinals. **No symbol, ISIN, company identifier or price is reproduced here**, because none is
committed (the utility prints none by design).

Verification of this table: 64 rows parsed, 64 `REPRODUCED`, exchange split NSE 63 / BSE 1,
`storedIdentity` object 1 / null 63 — matching the inventory and capture exactly.

| Holding | CSV holding / line | Input identifiers at import | Security identity stored in revision 1 | W04 observation | W06 identity status |
|---|---|---|---|---|---|
| H01 | G60 / line 61 | ISIN + NSE | **present** (D114 object) | 1 of 1 populated | USABLE — identity stored; must be confirmed by name/ISIN lookup |
| H02 | G01 / line 2 | ISIN + NSE | `NULL` | one of the 63 with no stored identity | NOT USABLE — ISIN known, series/P7 evidence absent from repo |
| H03 | G62 / line 63 | ISIN + NSE | `NULL` | one of the 63 with no stored identity | NOT USABLE — ISIN known, series/P7 evidence absent from repo |
| H04 | G63 / line 64 | ISIN + NSE | `NULL` | one of the 63 with no stored identity | NOT USABLE — ISIN known, series/P7 evidence absent from repo |
| H05 | G64 / line 65 | ISIN + NSE | `NULL` | one of the 63 with no stored identity | NOT USABLE — ISIN known, series/P7 evidence absent from repo |
| H06 | G61 / line 62 | ISIN + BSE | `NULL` | one of the 63 with no stored identity | NOT USABLE — ISIN known, series/P7 evidence absent from repo |
| H07 | G02 / line 3 | ISIN + NSE | `NULL` | one of the 63 with no stored identity | NOT USABLE — ISIN known, series/P7 evidence absent from repo |
| H08 | G03 / line 4 | ISIN + NSE | `NULL` | one of the 63 with no stored identity | NOT USABLE — ISIN known, series/P7 evidence absent from repo |
| H09 | G04 / line 5 | ISIN + NSE | `NULL` | one of the 63 with no stored identity | NOT USABLE — ISIN known, series/P7 evidence absent from repo |
| H10 | G05 / line 6 | ISIN + NSE | `NULL` | one of the 63 with no stored identity | NOT USABLE — ISIN known, series/P7 evidence absent from repo |
| H11 | G07 / line 8 | ISIN + NSE | `NULL` | one of the 63 with no stored identity | NOT USABLE — ISIN known, series/P7 evidence absent from repo |
| H12 | G08 / line 9 | ISIN + NSE | `NULL` | one of the 63 with no stored identity | NOT USABLE — ISIN known, series/P7 evidence absent from repo |
| H13 | G11 / line 12 | ISIN + NSE | `NULL` | one of the 63 with no stored identity | NOT USABLE — ISIN known, series/P7 evidence absent from repo |
| H14 | G12 / line 13 | ISIN + NSE | `NULL` | one of the 63 with no stored identity | NOT USABLE — ISIN known, series/P7 evidence absent from repo |
| H15 | G09 / line 10 | ISIN + NSE | `NULL` | one of the 63 with no stored identity | NOT USABLE — ISIN known, series/P7 evidence absent from repo |
| H16 | G13 / line 14 | ISIN + NSE | `NULL` | one of the 63 with no stored identity | NOT USABLE — ISIN known, series/P7 evidence absent from repo |
| H17 | G10 / line 11 | ISIN + NSE | `NULL` | one of the 63 with no stored identity | NOT USABLE — ISIN known, series/P7 evidence absent from repo |
| H18 | G14 / line 15 | ISIN + NSE | `NULL` | one of the 63 with no stored identity | NOT USABLE — ISIN known, series/P7 evidence absent from repo |
| H19 | G17 / line 18 | ISIN + NSE | `NULL` | one of the 63 with no stored identity | NOT USABLE — ISIN known, series/P7 evidence absent from repo |
| H20 | G18 / line 19 | ISIN + NSE | `NULL` | one of the 63 with no stored identity | NOT USABLE — ISIN known, series/P7 evidence absent from repo |
| H21 | G19 / line 20 | ISIN + NSE | `NULL` | one of the 63 with no stored identity | NOT USABLE — ISIN known, series/P7 evidence absent from repo |
| H22 | G15 / line 16 | ISIN + NSE | `NULL` | one of the 63 with no stored identity | NOT USABLE — ISIN known, series/P7 evidence absent from repo |
| H23 | G16 / line 17 | ISIN + NSE | `NULL` | one of the 63 with no stored identity | NOT USABLE — ISIN known, series/P7 evidence absent from repo |
| H24 | G21 / line 22 | ISIN + NSE | `NULL` | one of the 63 with no stored identity | NOT USABLE — ISIN known, series/P7 evidence absent from repo |
| H25 | G20 / line 21 | ISIN + NSE | `NULL` | one of the 63 with no stored identity | NOT USABLE — ISIN known, series/P7 evidence absent from repo |
| H26 | G22 / line 23 | ISIN + NSE | `NULL` | one of the 63 with no stored identity | NOT USABLE — ISIN known, series/P7 evidence absent from repo |
| H27 | G23 / line 24 | ISIN + NSE | `NULL` | one of the 63 with no stored identity | NOT USABLE — ISIN known, series/P7 evidence absent from repo |
| H28 | G27 / line 28 | ISIN + NSE | `NULL` | one of the 63 with no stored identity | NOT USABLE — ISIN known, series/P7 evidence absent from repo |
| H29 | G24 / line 25 | ISIN + NSE | `NULL` | one of the 63 with no stored identity | NOT USABLE — ISIN known, series/P7 evidence absent from repo |
| H30 | G25 / line 26 | ISIN + NSE | `NULL` | one of the 63 with no stored identity | NOT USABLE — ISIN known, series/P7 evidence absent from repo |
| H31 | G26 / line 27 | ISIN + NSE | `NULL` | one of the 63 with no stored identity | NOT USABLE — ISIN known, series/P7 evidence absent from repo |
| H32 | G30 / line 31 | ISIN + NSE | `NULL` | one of the 63 with no stored identity | NOT USABLE — ISIN known, series/P7 evidence absent from repo |
| H33 | G31 / line 32 | ISIN + NSE | `NULL` | one of the 63 with no stored identity | NOT USABLE — ISIN known, series/P7 evidence absent from repo |
| H34 | G28 / line 29 | ISIN + NSE | `NULL` | one of the 63 with no stored identity | NOT USABLE — ISIN known, series/P7 evidence absent from repo |
| H35 | G29 / line 30 | ISIN + NSE | `NULL` | one of the 63 with no stored identity | NOT USABLE — ISIN known, series/P7 evidence absent from repo |
| H36 | G32 / line 33 | ISIN + NSE | `NULL` | one of the 63 with no stored identity | NOT USABLE — ISIN known, series/P7 evidence absent from repo |
| H37 | G33 / line 34 | ISIN + NSE | `NULL` | one of the 63 with no stored identity | NOT USABLE — ISIN known, series/P7 evidence absent from repo |
| H38 | G34 / line 35 | ISIN + NSE | `NULL` | one of the 63 with no stored identity | NOT USABLE — ISIN known, series/P7 evidence absent from repo |
| H39 | G35 / line 36 | ISIN + NSE | `NULL` | one of the 63 with no stored identity | NOT USABLE — ISIN known, series/P7 evidence absent from repo |
| H40 | G36 / line 37 | ISIN + NSE | `NULL` | one of the 63 with no stored identity | NOT USABLE — ISIN known, series/P7 evidence absent from repo |
| H41 | G37 / line 38 | ISIN + NSE | `NULL` | one of the 63 with no stored identity | NOT USABLE — ISIN known, series/P7 evidence absent from repo |
| H42 | G06 / line 7 | ISIN + NSE | `NULL` | one of the 63 with no stored identity | NOT USABLE — ISIN known, series/P7 evidence absent from repo |
| H43 | G38 / line 39 | ISIN + NSE | `NULL` | one of the 63 with no stored identity | NOT USABLE — ISIN known, series/P7 evidence absent from repo |
| H44 | G39 / line 40 | ISIN + NSE | `NULL` | one of the 63 with no stored identity | NOT USABLE — ISIN known, series/P7 evidence absent from repo |
| H45 | G40 / line 41 | ISIN + NSE | `NULL` | one of the 63 with no stored identity | NOT USABLE — ISIN known, series/P7 evidence absent from repo |
| H46 | G43 / line 44 | ISIN + NSE | `NULL` | one of the 63 with no stored identity | NOT USABLE — ISIN known, series/P7 evidence absent from repo |
| H47 | G41 / line 42 | ISIN + NSE | `NULL` | one of the 63 with no stored identity | NOT USABLE — ISIN known, series/P7 evidence absent from repo |
| H48 | G42 / line 43 | ISIN + NSE | `NULL` | one of the 63 with no stored identity | NOT USABLE — ISIN known, series/P7 evidence absent from repo |
| H49 | G44 / line 45 | ISIN + NSE | `NULL` | one of the 63 with no stored identity | NOT USABLE — ISIN known, series/P7 evidence absent from repo |
| H50 | G45 / line 46 | ISIN + NSE | `NULL` | one of the 63 with no stored identity | NOT USABLE — ISIN known, series/P7 evidence absent from repo |
| H51 | G46 / line 47 | ISIN + NSE | `NULL` | one of the 63 with no stored identity | NOT USABLE — ISIN known, series/P7 evidence absent from repo |
| H52 | G47 / line 48 | ISIN + NSE | `NULL` | one of the 63 with no stored identity | NOT USABLE — ISIN known, series/P7 evidence absent from repo |
| H53 | G48 / line 49 | ISIN + NSE | `NULL` | one of the 63 with no stored identity | NOT USABLE — ISIN known, series/P7 evidence absent from repo |
| H54 | G49 / line 50 | ISIN + NSE | `NULL` | one of the 63 with no stored identity | NOT USABLE — ISIN known, series/P7 evidence absent from repo |
| H55 | G50 / line 51 | ISIN + NSE | `NULL` | one of the 63 with no stored identity | NOT USABLE — ISIN known, series/P7 evidence absent from repo |
| H56 | G51 / line 52 | ISIN + NSE | `NULL` | one of the 63 with no stored identity | NOT USABLE — ISIN known, series/P7 evidence absent from repo |
| H57 | G52 / line 53 | ISIN + NSE | `NULL` | one of the 63 with no stored identity | NOT USABLE — ISIN known, series/P7 evidence absent from repo |
| H58 | G53 / line 54 | ISIN + NSE | `NULL` | one of the 63 with no stored identity | NOT USABLE — ISIN known, series/P7 evidence absent from repo |
| H59 | G54 / line 55 | ISIN + NSE | `NULL` | one of the 63 with no stored identity | NOT USABLE — ISIN known, series/P7 evidence absent from repo |
| H60 | G57 / line 58 | ISIN + NSE | `NULL` | one of the 63 with no stored identity | NOT USABLE — ISIN known, series/P7 evidence absent from repo |
| H61 | G56 / line 57 | ISIN + NSE | `NULL` | one of the 63 with no stored identity | NOT USABLE — ISIN known, series/P7 evidence absent from repo |
| H62 | G55 / line 56 | ISIN + NSE | `NULL` | one of the 63 with no stored identity | NOT USABLE — ISIN known, series/P7 evidence absent from repo |
| H63 | G58 / line 59 | ISIN + NSE | `NULL` | one of the 63 with no stored identity | NOT USABLE — ISIN known, series/P7 evidence absent from repo |
| H64 | G59 / line 60 | ISIN + NSE | `NULL` | one of the 63 with no stored identity | NOT USABLE — ISIN known, series/P7 evidence absent from repo |

**Reading the table.** "Input identifiers at import" is what the CSV supplied — every row supplied both
an ISIN and an exchange. "Security identity stored in revision 1" is the persisted `security_identity`
column. "W04 identity observation" is what W04 correctly reported. "W06 identity status" is this
record's assessment of whether W06 can act on that row today.

**One resolved row.** `H01` (CSV `G60`, line 61, NSE) is the single holding whose D114 security
identity was qualified and stored. **Its ISIN, symbol and issuer are not in this repository** — W04
recorded them as *"reported for the one qualified holding, not shown"*
([W04 reconciliation](IIPS-W04-EVIDENCE-RECONCILIATION-AND-ACCEPTANCE-ASSESSMENT-2026-11-16.md) §7 row 5).
This record does not guess it, and does not substitute the Reliance identity accepted elsewhere —
that would be a symbol-based inference, which W04's criteria forbid.

---

## 4. Differences between the four views, and why each differs

| View | What it reports | Value | Why it differs |
| --- | --- | --- | --- |
| Broker-import identity resolution | Company gate outcome per row | 64 `RESOLVED` / `CANONICAL_P04` | Answers "was this row matched to one governed company?" — a precondition to import |
| Persisted holding identity | `security_identity` column | 1 populated, 63 `NULL` | Answers "is an exact ISIN+series security stored?" — additive, never blocking |
| W04 identity observations | The same stored column, counted | 1 / 0 ambiguous / 63 unavailable / 0 expired / 0 missing | Correct reading of the same column; W04 never claimed the 63 were import failures |
| W06 identity requirement | A stored, qualified identity per holding | Satisfied for 1 of 64 | Coverage measurement needs Layer 2, not Layer 1 |

**No discrepancy remains once the layers are separated.** The only genuinely open question — why the
63 failed qualification — is narrowed to the P7 series-evidence step and is unproven per row.

---

## 5. Missing evidence (explicitly marked unresolved)

| Missing | Consequence | How to obtain |
| --- | --- | --- |
| Per-holding symbol / ISIN / series for all 64 | The table cannot show *which* identity each row carries; 63 stay unresolved by name | The values exist in the host's revision 1 (recoverable from each row's lineage digest) and in the original CSV (`a3c3ee76…`, on the operator's machine). Publishing them needs a sanitization decision — they are the Principal's personal holdings |
| Per-row qualification failure reason for the 63 | The registry-size explanation cannot be confirmed row by row | Requires the failure reason to be persisted at import time, or a read-only re-qualification against today's registry — a future, separately authorized action |
| Which P7 registry the host loaded at import | The 96→4,680 explanation is graded `R`/`U`, not proven | Was never captured at import |
| Identity of the one resolved holding | Cannot name `H01` | Never supplied to any record |

None of these blocks the finding in §1, which rests on committed host output.

---

## 6. Correct starting point for W06 coverage measurement

1. **Denominator:** 64 holdings, revision 1, all active (`DHAN_PORTFOLIO`). Established, host output.
2. **Identity-qualified numerator today: 1.** Not 64. Any W06 report must use 1.
3. **The other 63 are `NULL` identity rows, not import failures and not missing identifiers.** W06 must
   class them as *identity not stored*, and must never call them unresolved-input or symbol-resolvable.
4. **W06 cannot reach 64 of 64 by re-running resolution.** The stored revision holds `NULL`; raising the
   count needs a **new revision written by a later import** against the current 4,680-mapping registry
   (PR #163 prerequisite). This is future import work, not a W06 measurement step.
5. **Quote coverage is a separate axis from identity coverage.** One live Reliance quote was accepted on
   2026-11-18 ([operator acceptance](DHAN-LIVE-RELIANCE-QUOTE-OPERATOR-ACCEPTANCE-2026-11-18.md)), but
   that holding's link to this revision's identity set is not established here. W06 must report identity
   coverage and quote coverage separately and must not let one imply the other.
6. **Do not use θI.** It remains not established (§K of the roadmap). W06 measures; it does not gate.

---

## 7. Sources used

| Purpose | Source |
| --- | --- |
| Per-row identity at import and in storage (64 rows) | [`w04-e4-csv-lineage-output.txt`](../../evidence/integration/w04-e4-original-csv-lineage-reproduction-2026-11-14/host-run-2026-11-14/w04-e4-csv-lineage-output.txt) §2, §4, §5 |
| Persisted revision counts and identity fields | [`portfolio-inventory-counts-2026-11-16.json`](../../evidence/integration/w04-evidence-reconciliation-2026-11-16/portfolio-inventory-counts-2026-11-16.json) |
| Persisted column names and null/populated split | Inventory archive `04-counts-and-relationship-summary.json`, `06-provenance-and-unresolved-records.json` |
| Code cause of the two layers | [`brokerImportPersistence.ts`](../../src/persistence/brokerImportPersistence.ts) lines 43–151; [`dhan_security_identity_service.ts`](../../src/providers/dhan/dhan_security_identity_service.ts) lines 100–113 |
| W04 findings, limits and superseded claims | [W04 evidence reconciliation](IIPS-W04-EVIDENCE-RECONCILIATION-AND-ACCEPTANCE-ASSESSMENT-2026-11-16.md) §5, §7, §12.10 |
| Two-layer semantics and the 64/64 trap | [D114 identity semantics basis](IIPS-CURRENT-PORTFOLIO-W04-P04-D114-IDENTITY-SEMANTICS-AND-COVERAGE-ACCEPTANCE-BASIS-2026-11-14.md) line 461 |
| W06 definition and status | [IIPS execution roadmap](IIPS-CURRENT-PORTFOLIO-EXECUTION-ROADMAP.md) §W06, §K |

This record adds no new host evidence and reads no database. It reconciles evidence already committed.
