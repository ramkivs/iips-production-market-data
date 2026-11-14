# Snapshot-to-Live W04 — C4/C5: identifier supply, source and owner. Decision assessment

**Date:** 2026-11-14
**Roadmap item:** W04, "Actual security and issuer coverage" ([roadmap](IIPS-CURRENT-PORTFOLIO-EXECUTION-ROADMAP.md))
**Subject:** the 63 holdings of captured portfolio revision 1 whose `securityIdentity` is `null` ([coverage assessment](IIPS-W04-IDENTITY-COVERAGE-REVISION-1-EVIDENCE-ASSESSMENT-2026-11-13.md))
**Repositories read:** IPD `ramkivs/iips-production-market-data` at this branch (`22c86a3`; identity sources identical to `main` `a624d06`); IRR `ramkivs/iips-review-recovered` at `main` `08411bc`, read-only
**Type:** investigation and documentation only. No runtime code, integration contract, registry, manifest or portfolio data was changed in either repository.

**W04 status is unchanged: PARTIALLY COMPLETE. Not accepted.**

| Question | Disposition |
|---|---|
| **C4** — authoritative source and owner | **Partially established.** The supply chain and its sources are identified. The internal owner and the approving authority are confirmed. The external publishers are identified by file label and URL only. No source in the chain is authoritative in the strict sense, by the repository's own designation, and no source-rights evidence exists for any external file. |
| **C5** — identifier-supply resolution | **Mixed; the split of the 63 remains unknown.** (a) partly confirmed; (b) confirmed; (c) confirmed for series, unconfirmed for ISIN and exchange in a genuine detailed export; (d) required for the holding-level input, not shown to be required for the series master; (e) confirmed in the strict sense, not a blocker for the bounded local use already approved. Section 7. |

Nothing was sent to anyone. Nothing on the Windows host was read. No identifier was assigned to any holding, and none was derived from a company name, a symbol, a `companyId` or an unrelated record.

## 1. How to read this record

**C4 and C5** name the two questions of this task. They are not the dispositions C1 to C7 of the Program Authority decision of 2026-10-19, and they are not the two conditions of the coverage assessment, which that record names C1 and C2. To keep the two apart, this record calls them **coverage condition 1** (revision 1 was written by the IPC import operation of a build that behaves as the reviewed source) and **coverage condition 2** (the tracked sources were the ones loaded). Neither condition is established.

The roadmap treats Broker Import as an accepted separate baseline, outside investigation and delivery. This task asked for the identifier supply to be traced, and the supply runs through that baseline. Its code and evidence were therefore read. Nothing in it was changed, and section 9 marks every step that would touch it.

| Label | Meaning |
|---|---|
| **H** | Observed on the Windows host and reported by the operator. Not re-read here. |
| **R** | Verified here from tracked repository content, by reading it or by running unmodified application code on tracked files. |
| **D** | Derived from **H** and **R**. Each derivation states its condition. |
| **U** | Unavailable: not retained, not observable from the repositories, or not supplied. |

Three identifiers make up the W04 mapping security → listing → issuer:

- **ISIN**: which security the holding is.
- **Exchange and series**: which listing of that security.
- **Issuer**: IRR's issuer for that security.

## 2. Finding 1 — the identifier-supply trace

### 2.1 Holding side

```
Broker holdings file, chosen by the operator in the browser          fields by layout: section 4.1
   │  IPD broker adapter, running in IRR's browser bundle
   │     Dhan adapter: ISIN and exchange only from columns named ISIN and Exchange
   ▼
Normalized row: symbol, isin?, exchange?                             series: never present
   │  IRR prepareBrokerImport: sends symbol; isin and exchange when present; never series
   │  IRR validateStage4Request: symbol without spaces; exchange NSE, BSE or absent
   ▼
IPC portfolio.importBroker  ──►  IPD
   │  1. Company gate (P04 master)
   │       a symbol needs an explicit exchange; every supplied identifier must resolve
   │       to the same company; one failing row refuses the whole import
   │       result: companyId, RESOLVED / CANONICAL_P04              (company level only)
   │  2. Security qualification (qualifyHoldingSecurityIdentity)
   │       needs the row's ISIN and the row's exchange
   │       P04: ISIN → company, ACTIVE listing on that exchange
   │       P7 registry: (company, exchange segment, ISIN) → series
   │       result: ISIN:<isin>:<series>, or null with the reason discarded
   ▼
Stored holding: symbol, companyId, security_identity or NULL          no ISIN, exchange, series
   │                                                                  or reason is kept elsewhere
   │  portfolio.get
   ▼
IRR projectD114SecurityIdentity (open PR #563 only): isin and series → resolver; exchange null
   │  IRR roster and listing map: 2,388 securities, each one NSE listing in series EQ
   ▼
issuer, security, listing — or UNMATCHED
```

### 2.2 Master side

```
NSE listing file  ─┐
BSE active list   ─┼─► D05 deposit of 2026-11-08 ─► P04 master: 2,390 companies, one ISIN each,
depository file,  ─┘                                 NSE 2,390 and BSE 2,290 listings, NO series
MCA bridge                                             │
                                                       └─► IRR export: 2,388 NSE listings, series EQ
                                                           taken from the universe definition

Dhan instrument master, snapshot of 2026-11-06 (EXCH_ID, SEGMENT, SECURITY_ID, ISIN, SERIES)
   └─► P7 qualification on 2026-11-06, against the P04 master of that day (2,250 records)
         └─► qualification-manifest.json: 96 mappings, 48 ISINs
               └─► registry read from disk when the IPC server starts
```

### 2.3 Where the supply can break

| # | Break | Effect | Evidence |
|---|---|---|---|
| B1 | The file has no exchange for a row | The company gate refuses the row, so the whole import is refused. No revision is written. | R; coverage R5 |
| B2 | The row has an exchange and a symbol but no ISIN | Company-level `RESOLVED`; `securityIdentity` `null`; no reason computed | R; coverage section 6.2 |
| B3 | The row has an ISIN and an exchange, and the registry has no mapping for them | `MISSING_P7_MAPPING`; `securityIdentity` `null` | R; section 5 |
| B4 | The symbol on the row is a broker label, not the listing symbol of that exchange | The company gate refuses the row even when its ISIN is in P04 | R; section 4.3 |
| B5 | Unqualified rows are stored without ISIN, exchange or reason | The cause cannot be recovered for revision 1, and revision 1 cannot be re-qualified | R; coverage R15, R16 |
| B6 | The holding is qualified with a BSE group (`A`, `B`) as series | IRR returns `AMBIGUOUS_LISTING`; its series list has no BSE group | R; decisions record, section 5.3 |

Under coverage conditions 1 and 2, a `null` on a holding of revision 1 is B2 or B3 (**D**, coverage section 6.2). Which one applies to any holding, and how the 63 divide, is unknown (**U**).

## 3. Finding 2 — sources and owners

### 3.1 Sources

| # | Source | Supplies | Publisher, as labelled | Standing in the repository |
|---|---|---|---|---|
| S1 | Broker holdings file of the operator's own account | Which securities are held: symbol, and ISIN and exchange where the layout has them | Dhan, as broker | Operator-owned input. No file is linked to revision 1 (**U**). Section 4. |
| S2 | P04 security master, batch `BATCH-D05-REPLACEMENT-AUTHENTICATED-UNIVERSE-2026-11-08-001` | Company, ISIN, NSE and BSE listing and status. No series. | Built in IPD from S4 | Governed corpus, mode `OFFLINE_BOOTSTRAP`. Not product-wide authoritative identity (P01 rule ID-4). |
| S3 | Dhan instrument master, two CSV files retrieved 2026-11-06 | Series per ISIN and exchange; Dhan's own security id | Dhan. The repository calls the files "official" and "public, no credentials". | Vendor evidence. Every identity built from it carries `isinAuthority: NON_AUTHORITATIVE`. |
| S4 | D05 Wave-3 source bundle of 2026-11-07 | NSE listing file (symbol, series, listing date, ISIN); BSE active-equity list (code, group, ISIN); a depository ISIN file; a classification document | NSE and BSE, by file name and layout. The depository is not named in the bundle. | "Original source files supplied during this work". No retrieval receipt. As-of dates of the exchange files are not attested. |
| S5 | P7 qualification manifest | The registry: 96 mappings | IPD, derived from S2 and S3 | Read at server start. Generated before the present S2 existed. Section 5. |
| S6 | IRR roster, listing map and corporate actions on the host | Issuer, security and one NSE `EQ` listing for 2,388 securities | IPD export of S2 | `OPERATOR_SUPPLIED`: attested by the operator, verified by nobody else. Approved for local, single-user, non-production use. |

### 3.2 Owners and responsible parties

**Confirmed by repository records (R):**

| Party | Responsibility | Record |
|---|---|---|
| IPD | Owns the P04 master, the P7 registry, the qualification and the construction of the D114 identity. "Series resolution and canonical identity construction are IPD-owned." | `src/providers/dhan/dhan_security_identity_service.ts`; Stage 3A and 3C records |
| The operator | Owns the broker holdings input. "A-5 input is operator-owned." | IRR `WS-A-DHAN-DETAILED-HOLDINGS-EXTERNAL-DEPENDENCY-2026-11-05.md` |
| Program Authority, recorded as Ramki | Authorized the P04 deposit (`AUTH-D05-REPLACEMENT-AUTHENTICATED-UNIVERSE-ACT-2026-11-08-001`). Approved the bounded use of the export (`W04-D1-20261114-01`). Owns the open gates G-01 to G-06 on vendor series, ISIN authority and freshness. | Deposit manifest; [decisions record](IIPS-W04-IDENTITY-PROVISIONING-DECISIONS-D1-D4-2026-11-13.md) A-3, A-11, P-8; [host completion](IIPS-W04-IDENTITY-PROVISIONING-HOST-COMPLETION-RECONCILIATION-2026-11-14.md); Stage 3D record |
| IRR owner | Owns IRR's identity model, its series list and the merge of PR #563. | Decisions record, D3 and D4-c |

**Not confirmed (U), and not to be assumed:**

- **Identity authority as a person.** Role A1 is assigned to nobody (decisions record, A-13). For the bounded local use, the repository owner instructed on 2026-11-14 that Ramki alone approves, as sole decision authority of the local single-user system; that closed question U-2 for that scope only. Outside that scope no record names a person who holds identity authority.
- **Who deposited the master.** The manifest names `OPERATOR_ADMIN_GOVERNED_01`. That is a role label, not a person.
- **Who retrieved the Dhan files.** The retrieval manifest names no person. It was committed on 2026-11-06 (`a8019f1`) under a personal author identity, not an agent's.
- **That the Dhan files are official.** "Official" is the repository's own word. No statement by Dhan is in the repository.
- **Where the NSE, BSE and depository files came from.** They were supplied without a retrieval receipt. Their publishers are read from file names and layouts.
- **Any contact, agreement or account relationship with a source holder beyond the operator's own broker account.** None is recorded.

### 3.3 Is an authoritative issuer and security source identifiable?

- **For the bounded local use:** yes. P04 for company, ISIN and listing; the Dhan instrument master for series, joined only by exact ISIN and exchange. This is the Stage 3C ruling, "conditional authority", and the IRR export of it is approved for that use (**R**).
- **In the strict sense — issuer-verified, exchange-certified or depository-certified:** no. Every qualified identity is `NON_AUTHORITATIVE`. P04 is not product-wide authoritative without a new ADR. Gates G-01 and G-02 are open (**R**). This uncertainty is preserved, not resolved.

## 4. Finding 3 — upstream fields available and missing

### 4.1 Holdings layouts found in the repositories

| Layout | Columns that bear on identity | ISIN | Exchange | Series | Genuine export in a repository? |
|---|---|---|---|---|---|
| `DHAN_WEB_UI_SUMMARY_V1`, governed, 8 columns | `Name` | no | no | no | Yes: IRR `dhan-holdings.csv`, operator-supplied |
| Dhan "Scrip Name / ISIN Code", 9 columns, not a governed variant | `Scrip Name`, `ISIN Code` | **yes** | no | no | Yes: IPD `evidence/operator_drop/wave2-2026-11-06/source.csv`. Recorded as a Dhan platform export reconciled by the owner with the demat statement; "not independently broker-authenticated"; no exchange-side evidence. IRR tracks the same bytes under `evidence/integration/b04-dhan-isin-nse-2026-11-06/`. The adapter cannot read this layout: `Scrip Name` is not a symbol column it accepts, and it reads an ISIN only from a column named `ISIN`. |
| `DHAN_DETAILED_HOLDINGS_V1`, governed, 11 columns | `Trading Symbol`, `ISIN`, `Exchange` | yes | yes | no | **Not established.** The one file in this layout has identifier cells that were rewritten in the repository. Section 4.2. |
| Zerodha, governed | `Instrument`; optional `ISIN` | optional; absent from the tracked file | no; the adapter assigns `NSE` unless the instrument is prefixed `BSE:` | no | Yes: IRR `zerodha-holdings.csv` |
| Groww, governed | symbol; optional `ISIN` | optional | no; the adapter always assigns `NSE` | no | None found |

No holdings layout has a series column (**R**). IPD has no client for a broker holdings API; the only holdings contract in either repository is the file the operator selects (**R**).

The Dhan adapter turns the `Exchange` cell into `BSE` when it contains "BSE" and into `NSE` for **any other non-empty value** (**R**). So an exchange of `NSE` on a normalized row does not show that the file said NSE.

### 4.2 The one file in the detailed layout

IRR tracks `evidence/broker-import/operator-supplied/dhan-holdings-withisin.csv` (**R**, IRR `08411bc`):

- The repository owner added it on 2026-11-09 and corrected its ISINs once.
- An agent commit then rewrote the ISIN column "against the authoritative B-04 rows, joined on quantity and average buy price", and set the Exchange column to `NSE` on all rows, "the user-supplied value", in place of four `UNLISTED` entries (`2649d8e`).
- The same commit records that, before it, 38 of the 68 rows carried the ISIN of a different security. A broker's own export would not do that, so the file was not an unmodified export when it was supplied either (**D**).

So its ISIN cells come from the 9-column file by a join on quantity and price, and its exchange cells are a designation supplied by the user. They are not cells of a Dhan export (**D**). **No artifact in either repository shows that a Dhan holdings export states ISIN and exchange per row** (**U**). The governed header says it does; a genuine file has not been recorded.

### 4.3 What the tracked files give when run through the unmodified IPD functions

Counts only ([probe output](../../evidence/integration/w04-c4-c5-identifier-supply-2026-11-14/tracked-broker-file-identifier-probe.output.json)). **These are tracked files. No link between any of them and revision 1 is established, and none is inferred.**

| | Detailed-layout file | Web UI summary file | Zerodha file |
|---|---|---|---|
| Rows | 68 | 68 | 82 |
| Rows with ISIN / with exchange | 68 / 68 (all `NSE`) | 0 / 0 | 0 / 82, assigned by the adapter |
| IPC company gate: pass / refused | 47 / 21 | 0 / 68 | 76 / 6 |
| Refusal reasons | 16 symbol not an NSE listing symbol; 2 symbol belongs to another company than the ISIN; 3 ISIN not in P04 | 68 no exchange | 6 symbol not an NSE listing symbol |
| Whole import refused by the gate, as tracked | yes | yes | yes |
| Security qualification, registry as loaded | 1 qualified; 64 `MISSING_P7_MAPPING`; 3 not in P04 | none possible | none possible: no ISIN |
| Security qualification, registry re-qualified in memory (section 5) | 65 qualified, all `EQ`; 3 not in P04 | none possible | none possible |

What this shows (**R**):

- None of the three files, imported whole, can produce a committed revision through the IPC import: each has rows the gate refuses.
- Removing rows does not help either. The detailed-layout file leaves at most 47 holdings, the Zerodha rows carry no ISIN and can yield no identity, and the summary rows have no exchange. Revision 1 has 64 holdings and one identity. So under coverage conditions 1 and 2 the input of revision 1 was none of these files, whole or with rows removed (**D**). A file with edited cells is not excluded, and neither condition is established.
- In the detailed-layout file the `Trading Symbol` cell is a broker label rather than the NSE listing symbol in 18 of the 65 rows whose ISIN is in P04. The IPC gate refuses those rows (B4). The browser preview resolves by ISIN and reports 65 resolved (IRR record of 2026-11-09). The two paths disagree.
- With the registry as loaded, 1 of 65 in-universe ISINs qualifies. With the same sources re-qualified, 65 of 65 do.

Revision 1 has 64 holdings with 1 identity populated (**H**). The file has 65 in-universe rows of which 1 qualifies. The counts are close and they are not equal. This is consistent with rows that carried ISINs and met B3. It does not establish it.

### 4.4 Fields available and missing, per identifier

| Identifier | Available upstream | Missing |
|---|---|---|
| ISIN of the holding | Stated per row in the 9-column Dhan file (2026-11-06) | Not on any Web UI summary or Zerodha row. Not stored for revision 1. For the import behind revision 1: unknown. |
| Exchange of the holding | No genuine artifact states it. The detailed-layout file carries a user-supplied `NSE`. Two adapters assign `NSE` by default. | Observed exchange evidence per holding. Not stored for revision 1, even for the one qualified holding. |
| Series of the listing | Never in a holdings file. In the Dhan instrument master, the NSE listing file and the BSE list for every P04 ISIN (section 5). | In the loaded registry: present for 45 ISINs, absent for 2,345. |
| Listing status | P04: `ACTIVE` for all listings, as of the deposit | A dated status after 2026-11-08 |
| Issuer | IRR roster, keyed by equity ISIN, for 2,388 securities | For a holding with no ISIN, nothing can be looked up |

## 5. The series evidence already tracked in IPD

The unmodified qualification function was run in memory over the tracked Dhan snapshot ([probe](../../evidence/integration/w04-c4-c5-identifier-supply-2026-11-14/p7-series-evidence-probe.mjs), [output](../../evidence/integration/w04-c4-c5-identifier-supply-2026-11-14/p7-series-evidence-probe.output.json)). It regenerated nothing and wrote nothing.

| # | Finding | Label |
|---|---|---|
| N1 | Against the legacy 2,250-record master, the snapshot gives 96 mappings for 48 ISINs, entry for entry the retained manifest. The manifest was generated on 2026-11-06; the master was replaced on 2026-11-08; the manifest was not regenerated. | R |
| N2 | Against the present 2,390-record master, the same snapshot gives **4,680 mappings covering all 2,390 P04 ISINs**: NSE `EQ` 2,390; BSE `A` 700; BSE `B` 1,590. 2,290 ISINs are on both exchanges and 100 on NSE only. No ISIN and exchange has more than one series. Ambiguous, duplicate and conflicting records: 0. | R |
| N3 | Of the 96 retained entries, 90 reappear unchanged. 6 do not: three ISINs, on two exchanges each, whose company id changed with the master. All 48 retained ISINs qualify under the present company id. | R |
| N4 | Holding-level qualification over every P04 listing (4,680): with the registry as loaded, 90 qualified and 4,590 `MISSING_P7_MAPPING`, which reproduces the result of 2026-11-13; with the re-qualified registry, 4,680 qualified and none unresolved. | R |
| N5 | The vendor series equals the exchange's own value for every mapping: the `SERIES` of the NSE listing file on 2,390 of 2,390, and the `Group` of the BSE list on 2,290 of 2,290. | R |

What follows (**D**): for a row that passes the company gate and carries the ISIN that P04 holds for that company, the series evidence already exists in tracked files. The loaded registry lacks it for 2,345 of 2,390 ISINs because it was built against the previous master. B3 is a stale projection inside IPD. It is not a missing source.

Limits:

- This is a measurement of sources. It classifies no holding of revision 1.
- The snapshot is from 2026-11-06. The P7 record says a snapshot is never claimed current beyond its retrieval time. The freshness threshold is gate G-03, open.
- Two files that agree are corroboration. Neither becomes authoritative by it.
- The probe is not a regeneration, and no record authorizes one.

## 6. Finding 4 — what kind of problem the gap is

| Class | Finding | Label |
|---|---|---|
| Source data | **Not shown for series.** Tracked sources hold a series for every P04 ISIN on every exchange where P04 lists it. **Shown for exchange:** no genuine holdings artifact states the exchange of a holding. | R |
| Export contract | **Confirmed in part.** No holdings layout carries a series, by design: series is supplied by IPD. The Web UI summary carries neither ISIN nor exchange. Whether a genuine Dhan export carries ISIN and exchange per row is not established. | R, U |
| Projection | **Confirmed, three places, all inside the two repositories.** The P7 registry is stale against the master (B3). The store keeps no ISIN, exchange or reason for an unqualified row (B5). The IPC gate requires the broker's symbol to be a listing symbol while the preview resolves by ISIN (B4). | R |
| Authority | **Confirmed.** No source is authoritative in the strict sense. Regenerating the registry, the freshness threshold, the series of a BSE listing and the universe scope each need a decision that has not been made. | R |

Which of these produced each of the 63 is **unknown**. The repositories cannot answer it. Host item E4 can, if a record was retained.

## 7. C5 — the five possibilities

| | Possibility | Evidence | Disposition |
|---|---|---|---|
| (a) | The identifiers already exist in an authorized existing source | Series and listing: yes, for every P04 ISIN (N2, N5), in files tracked in IPD and used under the Stage 3C ruling. They are not in the registry the application loads. ISIN and exchange **of each holding**: no. P04 holds one ISIN per company, but attaching it to a holding through its `companyId` or symbol is the derivation that the store, the W04 acceptance criteria and this task forbid. | **Partly confirmed.** True for series. Not true for the holding's own ISIN and exchange. |
| (b) | The identifiers exist but are omitted by the upstream holding-record projection | The registry omits 4,590 of 4,680 mappings that its own sources support (N4). The store omits the row's ISIN, exchange and reason (B5). IRR's browser projection passes ISIN and exchange when present and never sends series, which has no effect: no layout has a series, and IPD does not use a row's series on this path. | **Confirmed** as a mechanism. Its share of the 63 is unknown. |
| (c) | The Dhan export contract does not expose the required fields | Series: in no layout. ISIN and exchange: absent from the Web UI summary; ISIN present in the 9-column file; both present in the governed detailed header, for which no genuine file is recorded (section 4.2). The layout of the import behind revision 1 is unknown. Under coverage condition 1 its rows carried an exchange and a symbol that resolved as a listing symbol. | **Confirmed for series. Confirmed for the Web UI summary. Not established** for a genuine detailed export. |
| (d) | An additional authorized source extract is necessary | Holding level: yes. Revision 1 keeps nothing to re-qualify (B5), so identity for the 63 can only come from a new governed import whose rows carry the broker-stated ISIN and an observed exchange. That is an export of the operator's own account. Series master: not shown to be necessary inside the 2,390 universe; the tracked snapshot suffices, subject to G-03. A fresh extract is needed only if G-03 requires one, or for holdings outside the universe. | **Required** for the holding-level input. **Not shown to be required** for the series master. |
| (e) | The authoritative source or owner cannot yet be established | Strict authority: not established (section 3.3). Owner for the approved local use: established (section 3.2). Rights for every external file: not established (section 8). | **Confirmed** for strict authority and for rights. Not a blocker for the bounded local use. |

### 7.1 Minimum information needed to resolve the gap

For each holding, from evidence about that holding and never by derivation:

1. **The ISIN** as stated for the position by the broker or the depository, traceable to a cell of a retained file whose digest is recorded.
2. **The exchange** as observed for the position. A value assigned by an adapter default or typed in afterwards is a designation, not evidence, and should be labelled as such.
3. **The series** for that ISIN on that exchange, from the series master with its snapshot time. Never from the broker row, and never defaulted.
4. **The listing status** from P04, with the batch.
5. **The source versions** in force: file digest and layout; P04 batch; P7 manifest digest and snapshot time; IRR roster digest.

For the diagnosis alone, counts are enough: of the rows of the import behind revision 1, how many carried an ISIN and how many an exchange (E4).

## 8. Finding 5 — source rights

### 8.1 What exists

| Evidence | What it establishes | Label |
|---|---|---|
| Approval `W04-D1-20261114-01` and permitted use P-2 | The principal permits the export of P04 to be used on the operator's own machine, single-user and non-production. This is an internal permission. It grants nothing on behalf of a third party. | H, R |
| Program Authority decision of 2026-10-19, C2 | Licensing and entitlement are kept separate from identity: "Entitlement does not prove that an instrument is real-market; identity does not prove entitlement." | R |
| Roadmap, blocker B03 and the external-rights row | Source rights are "unknown, not denied". Third-party permission is to be obtained "only if its terms require it"; the grant of the Program Authority is not another party's right. | R |
| Decisions record, U-14 | The publishers' terms for storing and using each file "in a personal application" were not read. | R |
| P7 record and retrieval manifest | The Dhan files were taken from two URLs on `images.dhan.co`, described as public and needing no credentials. | R |
| D114 authority decision of 2026-09-20, about a different dataset | The programme's stated position for a public exchange archive: access "strictly for offline development & structural validation; production redistribution rights NOT granted". | R |

### 8.2 What does not exist

A search of both repositories for licence, terms of use, redistribution, permitted use and rights found **no terms, licence, agreement or permission from Dhan, NSE, BSE, a depository or MCA** for any tracked file (**R**, by search). That a file can be downloaded without credentials is not evidence of a right to store, use or republish it.

### 8.3 Unresolved permissions

| # | Question | Bears on |
|---|---|---|
| P1 | Dhan's terms for downloading, keeping and using the instrument master to map ISIN to series in a personal tool | S3, S5 |
| P2 | Dhan's terms for keeping a copy of the instrument master in a repository that others can read | S3 |
| P3 | NSE's, BSE's and the depository's terms for the listing and ISIN files in the bundle, on the same two points | S4, and S2 and S6 built from it |
| P4 | Whether a broker holdings export may be kept in a repository at all. This is the operator's own data and the operator's decision. | S1 |

### 8.4 A fact the owner should know

GitHub reports **both repositories as public** (API read, 2026-11-14). `package.json` says `UNLICENSED` and there is no licence file. On `main`, publicly readable, are:

- the two Dhan instrument-master files (62 MB) and the source bundle with the NSE, BSE and depository files — the files of P2 and P3;
- files that repository records describe as exports of the operator's own broker account, with quantities and prices: IPD `evidence/operator_drop/wave2-2026-11-06/` and IRR `evidence/broker-import/operator-supplied/`, and the 68-row fixtures built from them.

This record changes none of it and judges none of it. Removing a file from history is a destructive operation that needs the owner's instruction. The published W04 records have withheld symbols and ISINs throughout; the owner may wish to decide whether these tracked files should remain public.

## 9. Finding 6 — recommended resolution path

Nothing below was executed. Each step names its authority.

| # | Step | Authority | Why |
|---|---|---|---|
| 1 | **Host, read-only.** Complete item E4 of the coverage assessment, with two additions. (i) From the retained IRR import record, also publish its `broker` and `variant`, and from the capture the number of holdings per source broker. (ii) Compare the `contentDigest` of the contribution in the local capture with the SHA-256 of each tracked candidate file: IRR `evidence/broker-import/operator-supplied/*.csv` and IPD `evidence/operator_drop/wave2-2026-11-06/source.csv`. A digest that differs proves nothing, because the digest may be computed over decoded text rather than the file's bytes (section 15); report equality only. Publish yes or no per file, and counts. Publish no symbol, ISIN or value. | Operator | Gives the split of the 63 between B2 and B3, and the layout. Without it every later step is chosen blind. |
| 2 | **Decide** whether the P7 registry is to be re-qualified against the present master, and from which snapshot: the retained one of 2026-11-06, with its date accepted as a named limitation, or a fresh one. Then make it as a separate, tested IPD change with the repository's own runner. **Baseline:** the registry is loaded by the Broker Import composition. | Program Authority (gates G-02, G-03, and the baseline); then IPD | Closes B3 for every P04 ISIN (N2, N4). It changes a file the server loads, so it is outside a documentation task. A fresh snapshot is a retrieval from Dhan's host and waits on P1. |
| 3 | **Decide** how the IPC gate treats a row whose ISIN is in P04 and whose symbol is a broker label. **Baseline.** | Program Authority (baseline); IPD owner | B4. On the tracked detailed-layout file 18 of 65 in-universe rows are refused for this alone. |
| 4 | **New governed import** from a genuine export that states the ISIN per row, with an observed exchange. It writes a new revision. Revision 1 is left as it is. **Baseline.** | Operator, under a separate authorization for a portfolio write | The only route to identity for the 63 (B5). It is a portfolio mutation and is not part of this task. |
| 5 | **IRR:** merge PR #563, then run the four-GET operation of the [revision-binding assessment](IIPS-W04-IRR-IDENTITIES-ENDPOINT-REVISION-BINDING-ASSESSMENT-2026-11-13.md), section 8, and record the coverage. | IRR owner; operator | Measures W04 on the new revision. |
| 6 | **Decide** the representation of a BSE series (D4-c), and whether holdings outside the 2,390 universe stay unresolved and reported. | IRR owner and IPD owner; Program Authority | B6. Three rows of the tracked file are outside the universe; the earlier decision declined to widen it. |
| 7 | Optional: keep the typed reason and the row's own inputs for an unqualified holding. **Baseline.** | Program Authority (baseline); IPD owner | B5. It would make the next gap diagnosable from the store. |

**Baseline** marks a step that changes or uses Broker Import. The roadmap records Broker Import as an accepted separate baseline, excluded from delivery dependencies, and says an exception needs the boundary owner's permission or a revised instruction (blocker B07). Steps 2, 3, 4 and 7 are such exceptions. This record recommends them and authorizes none. If the exception is refused, W04 coverage for these holdings stays at what revision 1 holds, and the 63 are reported as unavailable.

Not recommended, and not done:

- Attaching P04's ISIN to a holding through its `companyId` or symbol. P04 has exactly one ISIN per company, so the join is exact as a lookup. It is still identity from a symbol, which the W04 acceptance criteria exclude.
- Using the tracked detailed-layout file as identity evidence for revision 1. Its identifier cells were rewritten in the repository and it is not linked to revision 1.
- Editing revision 1.

Steps 1, 2 and 4 are ordered. If step 1 shows that the rows carried ISINs, step 2 alone removes the cause and step 4 can reuse the same export. If it shows they did not, step 4 needs a different export first, and the question of section 10 becomes the blocker.

## 10. Finding 7 — external confirmation required

**For the diagnosis: none.** Step 1 is the operator's own evidence on the operator's own host.

**For the resolution**, three confirmations lie outside the repositories. The first can be made by the operator without contacting anyone.

| # | Confirmation | Who can give it | Needed for |
|---|---|---|---|
| X1 | Whether the operator's Dhan account offers a holdings export that states **ISIN and exchange per row**, and its exact header. | The operator, by looking at the account's own reports. Dhan, if the operator cannot tell. | Step 4. Section 4.2. |
| X2 | The terms under which the instrument-master files may be downloaded, kept and used for ISIN-to-series mapping in a personal tool, and kept in a repository others can read. The meaning of `SERIES` for an NSE and for a BSE row. | Dhan's published terms, read by the operator. Dhan, if the terms do not say. | Step 2 with a fresh snapshot; P1, P2. |
| X3 | The same two points for the NSE, BSE and depository files. | Each publisher's published terms; the publisher, if they do not say. | P3. Not needed to resolve the 63. |

Reading published terms is not a contact. Whether any request has to be sent can be decided only after X2 has been read. The terms were not read here: the sandbox reaches none of the publishers, and this task excludes requests to source holders.

## 11. Finding 8 — proposed source-holder request

**NOT SENT. A draft for the principal's review.** It contains no holding, quantity, value, account identifier, credential or ISIN. It should be sent, if at all, by the account holder through the broker's own support channel, and only for the questions that the published terms and the account's own reports leave open.

> **To:** Dhan customer support / DhanHQ API support
> **From:** an individual account holder
> **Subject:** Instrument master files and holdings report: permitted personal use and field meaning
>
> I hold a trading and demat account with Dhan. I maintain a personal, single-user, non-commercial tool on my own computer to review my own holdings. It places no orders and serves no other person. I would be grateful for confirmation of the following.
>
> **A. Instrument master files**
>
> 1. Are `api-scrip-master.csv` and `api-scrip-master-detailed.csv`, as published under `images.dhan.co/api-data/`, the official instrument master files of Dhan?
> 2. Under which terms may an account holder download them, keep a dated copy, and use the `ISIN`, `EXCH_ID`, `SEGMENT`, `SECURITY_ID` and `SERIES` columns to relate an ISIN to its exchange series in such a personal tool? Please point me to the document that governs this.
> 3. Do those terms permit keeping a copy of the files in a version-controlled repository, including one that other people can read? If not, what is permitted?
> 4. In the detailed file, what does `SERIES` contain for an NSE equity row and for a BSE equity row? For BSE, is it the exchange group? Are these values taken from the exchanges?
> 5. How often are the files refreshed, and is the time of the last refresh published?
>
> **B. Holdings reports**
>
> 6. Which holdings report or export available to an account holder states, for each position, the ISIN and the exchange? What is its exact column header?
> 7. Does any holdings report state the exchange series of a position?
> 8. In a holdings report, is the trading-symbol column the exchange's listing symbol or a Dhan display label?
> 9. For a security listed on both NSE and BSE, what does the exchange shown against a holding represent?
>
> I am not asking for any account-specific data in reply. A reference to the published documentation is sufficient.

A request to an exchange or a depository under X3 would ask only the equivalents of questions 2 and 3 for its own listing file. None is drafted: it is not needed to resolve the 63.

## 12. Evidence inspected

**IPD (R):**

- W04 records: coverage assessment; decisions D1 to D4; host completion and reconciliation; revision-binding assessment; Dependency 1 disposition; roadmap.
- Identity authority: `IRR_STAGE_3A_HOLDING_IDENTITY_AUTHORITATIVE_SOURCE_ASSESSMENT.md`; `IRR_STAGE_3C_D05_VS_P7_SECURITY_IDENTITY_AUTHORITY_RECONCILIATION.md`; Stage 3D readiness and governance decision; Stage 4D composition record; `docs/DHAN-P7-INSTRUMENT-MASTER-QUALIFICATION.md`; the Program Authority decision of 2026-10-19.
- P7: `evidence/dhan-p7/` — retrieval manifest, retrieval log, qualification manifest and report, reconciliation report, both source files; `scripts/dhan-p7-qualify.mjs`.
- P04: `evidence/operator_drop/d05_security_master_authenticated_universe_2026-11-08.manifest.json`; `src/identity/governed_fixture_master.ts`; the Wave-3 bundle (member list, README and the headers of the NSE, BSE and depository members); the Wave-3 validation and reconciliation records.
- Holdings layouts: `evidence/bi04/dhan-web-ui-summary-v1-schema.md`; the three broker adapters and the mapper under `frontend/src/features/portfolio/import/`; `evidence/operator_drop/wave2-2026-11-06/` (header and disposition record); `evidence/operator_drop/wave3-2026-11-06/acquisition-attempt-log.json`; `evidence/integration/ws-a-dhan-68-row/README.md`; the Wave-2 disposition and the 68-row reassessment.
- Code on the path: `src/contracts/broker_import_ipc.ts`; `src/identity/broker_observation_resolver.ts`; `src/persistence/brokerImportPersistence.ts`; `src/providers/dhan/dhan_security_identity_service.ts`, `dhan_local_daemon.ts`, `dhan_instrument_master_qualification.ts`; `src/ipc/brokerImportComposition.ts`.
- Rights: a search of the tracked files for licence and terms; `evidence/d114/stage4-authority-decision.json`; `package.json`.

**IRR at `08411bc`, read-only (R):**

- `frontend/src/api/brokerImportStage4.ts`; `frontend/server/broker-import/brokerImportStage4.ts`, `brokerImportIdentityQualification.ts`, `brokerImportEvidenceStore.ts`.
- `docs/integration/WS-A-DHAN-DETAILED-HOLDINGS-EXTERNAL-DEPENDENCY-2026-11-05.md`, `WS-A-68-ROW-IDENTITY-ASSESSMENT-RECONCILIATION-2026-11-09.md`, `WS-A-BROKER-IMPORT-RUNTIME-AUTHORITY-VERIFICATION-2026-11-09.md`.
- `evidence/broker-import/operator-supplied/` — three files, their headers and their commit history; `evidence/integration/b04-dhan-isin-nse-2026-11-06/source.csv` (digest only).
- Branch `d114-wire-to-resolver-input-test` (PR #563 plus one test): the projection of the D114 object into the resolver input.

**GitHub API:** the visibility of the two repositories.

## 13. Verification performed

All in a Linux sandbox, on repository content only.

| Check | Result |
|---|---|
| IPD `npm run build:tsc` | exit 0 |
| `p7-series-evidence-probe.mjs` | exit 0; output identical on two runs; snapshot SHA-256 equals the retrieval manifest; N4 reproduces the 2026-11-13 probe (90 qualified, 4,590 `MISSING_P7_MAPPING`) |
| `tracked-broker-file-identifier-probe.mjs` against IRR `08411bc` | exit 0; output identical on two runs; IRR working tree unchanged afterwards |
| Probe outputs searched for an ISIN pattern | none |
| IPD `npm test` on this branch, and the link check of the new files | recorded in the [evidence folder](../../evidence/integration/w04-c4-c5-identifier-supply-2026-11-14/README.md) |

The probes read tracked files. They read no capture, database or host state, they write nothing, and they print counts and digests only.

## 14. Status

| Part | State |
|---|---|
| C4: sources, owners, rights | Recorded. Strict authority and rights: not established, and stated as such. |
| C5: five possibilities | Each disposed in section 7. |
| Split of the 63 by cause | **Unknown.** Needs step 1 on the host. |
| The input that produced revision 1 | **Unknown.** Not one of the tracked files as tracked. |
| W04 | **PARTIALLY COMPLETE. Not accepted.** |

Next activity: step 1 of section 9, on the host, together with the four-GET operation already defined. The decisions of steps 2, 3 and 6 can be taken in parallel; none depends on the host.

## 15. Not done, and not examined

Not done:

- No message, call or request to Dhan, an exchange, a depository or anyone else. The draft of section 11 was not sent.
- No credential or token requested or read.
- No portfolio read on the host, and no portfolio change anywhere.
- No change to the Dhan integration, to the P7 manifest or registry, to P04, or to any contract.
- No change to IRR. No pull request merged, closed or retargeted.
- No work on W05 to W20.

Not examined:

- The capture, the IRR import journal and anything else on the Windows host.
- Which build wrote revision 1, from which file, and with which sources loaded.
- The published terms of Dhan, NSE, BSE, the depositories or MCA.
- Whether the tests and records that pin the 96-mapping manifest would need to change with a re-qualification.
- Whether IRR's import screen lets the operator drop rows before saving.
- Whether `contentDigest` equals the SHA-256 of the file's bytes. IPD's ingress digests the content it is handed; whether IRR's browser hands it the file's bytes or decoded text was not examined.
- The source broker recorded on the holdings of revision 1.
- The depository file's content, beyond its header and row count.
