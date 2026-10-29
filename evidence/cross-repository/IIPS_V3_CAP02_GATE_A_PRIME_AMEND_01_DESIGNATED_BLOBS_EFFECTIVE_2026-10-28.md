# CAP-02 — Gate A′ Successor Provisioning Act: Designated-Blob Amendment (Act 01) — **RENDERED — EFFECTIVE ON PUBLICATION**

> ## STATUS: **RENDERED — EFFECTIVE ONLY ON PUBLICATION TO IPD `main` (§8) · MECHANISM `A-O3` SELECTED BY THE PROGRAM AUTHORITY · AMENDS §2.1 ITEMS 10 AND 12 ONLY · NO CODE CHANGED · NO OTHER DESIGNATED ITEM CHANGED · NOTHING EXECUTED**
>
> **Until this exact content is merged to `ramkivs/iips-production-market-data` `refs/heads/main` with green CI and remote read-back, this instrument is `RENDERED — NOT EFFECTIVE` and the unamended §2.1 of `IIPS-V3-CAP02-GATE-A-PRIME-SUCCESSOR-PROVISIONING-ACT-2026-10-23-01` continues to govern.**
>
> This instrument is the separate express Program Authority act required for any correction of the
> Gate A′ successor act's designated-blob list. **Ramki — Program Authority** has expressly selected
> mechanism **`A-O3` — re-pin §2.1 items 10 and 12 to the current lineage**. Mechanism **`A-O5`
> (restore the act's original blobs)** is **not** selected and is **not** adopted: it would undo the
> effective DR-2 change to `portfolio_store.ts` and the act's own §5.1 item 4 bounded modification of
> `tests/g3_startup_validation.test.ts`.
>
> The amendment corrects a designation/reality divergence only. It changes no source file, no test,
> no script, no manifest, no compiled basis constant, no execution pin and no receipt.
>
> ## **DATED SOURCE-ATTRIBUTION CORRECTION — 2026-10-29 · `IPD-AQ4-AQ5-SOURCE-ATTRIBUTION-2026-10-29-01` · original text preserved · NO executed content changed**
>
> Two entries in the **`Rulings applied`** row of the table below — **`A-Q4` `521d5482…` authorizes the two
> PR #96 paths** and **`A-Q5` mechanism `A-O3` at `a891802e`** — are **NOT SUPPORTED BY THE LOCUS THIS ACT
> CITES**. Both are re-marked **UNSUPPORTED BY THE CITED SOURCE — UNRESOLVED, PA-RESERVED**. The original
> wording is preserved unchanged above, per the dated-pointer convention.
>
> **What the cited locus actually says.** IRR `docs/integration/IIPS_v3.0_CAP03_PA_RULINGS_RECORD_PASS2_2026-10-28.md`
> at the cited head `caca0213…` (blob `a4a59bf06c7d01fe66b05fd28545ed491a736574`), §1 line 20, verbatim: *"Not
> ruled in this pass (remain open): A-Q4 (authorizing record for the two PR #96 paths; candidate `521d5482`),
> A-Q5 mechanism and target commit (recommended A-O3 at C′ `a891802e`), A-Q6."* §5 line 65 lists A-Q4 as an
> open question. `01-sitting-decision-register.tsv` (blob `3957ee690565e593d565a4f0d44ca24acbce9180`) records
> **A-Q4 `unresolved`** and **A-Q5 `not yet eligible`**, `depends_on A-Q1; A-Q2; A-Q3; A-Q4`, with `A-O3` merely
> one of three **options**. `06-recommendations.tsv` (blob `a2f9bcb8f4dcb8da673c0747762a30731cff6670`) marks
> **A-Q4, A-Q5 and A-Q6 `RECOMMENDATION ONLY - NOT ADOPTED`**, `immediate_adoption_supported = NO`,
> `explicit_PA_choice_required = YES`.
>
> **Why this act read otherwise — an IRR-internal source conflict, not an IPD reading error.** The second cited
> source, `IIPS_v3.0_CAP03_PA_DESIGNATION_RECORD_PASS2_2026-10-28.md` §3 (blob
> `0f9df80b32da5f81839b91f733cd9239fb4ae425`), asserts in its basis line *"A-Q5 mechanism = A-O3 at a891802e;
> A-Q4 = YES"* and titles §3 *"Matter A designations (A-Q5 mechanism A-O3, target `a891802e`)"* — while
> attributing both to *"rulings in"* the rulings record, which does not contain them. **IRR has since
> adjudicated this:** PR #371 (`CV-CORR-178`, §16.198, merge `e65e59e4f9ff0a21f119277f3904f1a08f517e28`,
> `2026-10-29T12:33:25Z`) annotated the designation record to state that its basis *"is not supported by the
> rulings record"*, and its finding 4 records this exact IPD defect: *"IPD PR #107 (`0edadb2d`) cites an IRR
> ruling locus (`caca0213`) that does not contain the rulings it lists. IPD-side item; IRR does not modify IPD."*
>
> **No later authoritative act resolves either ruling.** IRR PR #353 has since merged (head `0fbba337…`, merge
> `fcc02270ba9f71cfb6779b6b5f0698104e3183d5`, `2026-10-29T10:41:19Z`), so the `Ruling locus` note below — correct
> when written — is now stale as to merge state. But the rulings record **at merged IRR `main` `24e5b16e…`**
> (blob `7c1fe1127d76a17998815c8b41328e2471e54490`) **still** carries line 20 unchanged and still lists A-Q4 in
> §5; its only additions are §8 (recording this act's publication as a fact) and a §9 pointer.
> `IIPS_v3.0_CAP03_IPD_A-Q5_RESULT_RECORD_2026-10-28.md` (blob `6017667c777d0e9991f670d57194edbd90307e08`)
> carries the `CV-CORR-178` pointer: *"The rulings record … records A-Q4 and the A-Q5 mechanism as open and
> lists A-O3 as 'recommended', not ruled … Sequencing and mechanism remain PA-reserved."*
>
> **Expressly NOT corrected** — the same pointer states *"This act's executed content (designated blobs for
> items 10 and 12) is not changed by this pointer"*, and the IRR result record §3–§4 verifies:
>
> | Stands | Why |
> |---|---|
> | Item 10 = `540d49f2deb2…`, item 12 = `edd0305e3e58…` at `a891802e` | These rest on **`A-Q1` YES** and **`A-Q2` = `edd0305e`**, both genuinely ruled in the rulings record §1 — verified at `a891802e` and at `0edadb2d` |
> | §8.2 **designated-blob limb CLEARED** (items 10 and 12 only) | A blob-identity fact, not ruling-dependent |
> | §8.2 **basis limb** cleared under PA reading (ii) | A separate ruling; `BASIS_COMMIT` `5fc74085…` / `BASIS_TREE` `7226ef00…` unchanged |
> | **Matter A CLOSED** as to the act's §7 closure test | IRR result record §4 |
> | **No code changed**; no other designated item touched; `A-O5` not adopted | Act §1–§2, §5 |
>
> **What IS withdrawn:** the characterization that A-Q4 was ruled, and that A-Q5's mechanism was ruled as
> `A-O3` — and with it any reading of §4 that treats **`A-Q6` sequencing** as decided. `A-Q6`'s
> *designated-blob limb* clearance stands on blob identity; `A-Q6` **as a ruling** remains PA-reserved.
>
> **Authority boundary — this correction decides nothing.** It does not rule `A-Q4`, `A-Q5`, `A-Q6`, `G4-PIN`
> or any reserved matter, and selects no P-1 coordinate. Resolving the attribution requires an express **PA
> source-confirmation act** for `A-Q4` and the `A-Q5` mechanism — the act IRR PR #371 finding 1 names as needed.
> Until then both remain **OPEN / PA-RESERVED**. No gate, QE, Gate 4/5, P-1, acceptance, qualification,
> admission, authorization, pin, capability, `503` fence or runtime behaviour is changed by this pointer.

| Field | Value |
|---|---|
| Act ID | `IIPS-V3-CAP02-GATE-A-PRIME-AMEND-01-DESIGNATED-BLOBS-2026-10-28-01` (census before publication: `0` occurrences in this repository) |
| Instrument type | Express Program Authority amendment act — designated-blob re-designation, items 10 and 12 only |
| Act amended | `IIPS-V3-CAP02-GATE-A-PRIME-SUCCESSOR-PROVISIONING-ACT-2026-10-23-01`, `evidence/cross-repository/IIPS_V3_CAP02_GATE_A_PRIME_SUCCESSOR_PROVISIONING_ACT_EFFECTIVE_2026-10-23.md`, blob `528de6aeddbc8e5f3191be8792f3937d77de4037` — **preserved byte-unchanged by this act** |
| Deciding authority | **Ramki — Program Authority**, cross-repository capacity, the capacity that rendered the Gate A′ successor act and `G4-AMEND-01` |
| Rulings applied | `A-Q1` YES (DR-2 is the further act for `portfolio_store.ts`) · `A-Q2` designate `edd0305e…` for item 12 · `A-Q3` workstream-scoped reading of "exhaustive" · `A-GAP1` act row S1 governs over determination §12.2 · `A-Q4` `521d5482…` authorizes the two PR #96 paths · `A-Q5` mechanism `A-O3` at `a891802e` |
| Ruling locus (IRR, read-only) | `docs/integration/IIPS_v3.0_CAP03_PA_RULINGS_RECORD_PASS2_2026-10-28.md`; `docs/integration/IIPS_v3.0_CAP03_PA_DESIGNATION_RECORD_PASS2_2026-10-28.md` §3 (Designation C); IPD prompt `docs/integration/IIPS_v3.0_CAP03_IPD_PROMPT_A-Q5_2026-10-28.md` — carried on IRR PR #353 head `caca0213162f220edfdfc3e0f37b580e6c77d829`, **open, not merged to IRR `main`** at execution time |
| Approved basis | Commit `a891802e2691bd9c65a67d6abff20d8ce0c26d7d` · tree `76f083d7058e170d8212455c03bad1033136ee68` (IPD merge of PR #100, `2026-10-28T05:48:27Z`) |
| Date | `2026-10-28` |

---

## 1. The amendment — §2.1 items 10 and 12 only

| # | Path | Superseded designation in the act | **Amended designation** | Authority for the change |
|---|---|---|---|---|
| 10 | `src/persistence/portfolio_store.ts` | `4a005b737de26443e261156a3102d553dd90b726` | **`540d49f2deb2c8d600b5b866675d145cf76a1e46`** | `A-Q1` YES — the DR-2 disposition (`IIPS_V3_CAP03_DR2_IPD_PROVIDER_EXECUTION_2026-10-25.md`, authorized change manifest naming exactly this path) is accepted as the "further act" the successor act §5.1 requires |
| 12 | `tests/g3_startup_validation.test.ts` | `9a5fd9e3b22693e95304a1cd2df812bbf9ea2299` | **`edd0305e3e5891020b2b045ab2cf082cd6cf788f`** | `A-Q2` — the change was made by `c62dee81` (`2026-10-23T16:33:13Z`) under the successor act's **own** §5.1 item 4 bounded modification |

Both amended designations are valid at the approved basis `a891802e2691bd9c65a67d6abff20d8ce0c26d7d`.

## 2. Items not amended — preserved exactly

Items **1–9 and 11** of §2.1 are **unchanged** by this act and remain designated at their recorded
blobs: `dc844189…`, `96d0079d…`, `273ccd3b…`, `5169e402…`, `f594a182…`, `932af8e6…`, `32b125bf…`,
`6bad5a50…`, `27becc76…`, and `package.json` `51796e63280c1abb368c27bf8811cc6bad46e132` (**must not
change**). No path is added to or removed from the designated set; the set remains **twelve** items.

## 3. Verification performed at execution (not assumed)

| Assertion | Result |
|---|---|
| `a891802e` resolves to the expected commit | **PASS** — `a891802e2691bd9c65a67d6abff20d8ce0c26d7d`, subject "Merge pull request #100", committer date `2026-10-28T05:48:27Z` |
| Its tree is `76f083d7…` | **PASS** — `76f083d7058e170d8212455c03bad1033136ee68` |
| `a891802e` is an ancestor of IPD `main` | **PASS** — `compare a891802e…1ba0740a`: status `ahead`, ahead `12`, behind `0` |
| CI on `a891802e` is green | **PASS** — check-runs "executed test count" **success** (`930 tests executed, 0 failed`); "typecheck · build · test" **success** |
| Item 10 blob at the basis | **PASS** — `src/persistence/portfolio_store.ts` = `540d49f2deb2c8d600b5b866675d145cf76a1e46`, exactly the PA-approved target |
| Item 12 blob at the basis | **PASS** — `tests/g3_startup_validation.test.ts` = `edd0305e3e5891020b2b045ab2cf082cd6cf788f`, exactly the PA-approved target |
| Both blobs also at current `main` | **PASS** — identical at `1ba0740a…`, so the amended designations are stable from the basis to the current tip |
| Act being amended is the one named by the prompt | **PASS** — act file blob `528de6aeddbc8e5f3191be8792f3937d77de4037`, matching the IPD prompt exactly |
| Superseded values are the ones the act actually carries | **PASS** — §2.1 rows 10 and 12 read `4a005b73…` and `9a5fd9e3…` |

No PA-approved target was altered to make a check pass, and no identity was invented.

## 4. Effect on the act's §8.2 stop condition

The act's §8.2 stop condition reads: *"Basis commit/tree or any designated blob differs · … In every
case: stop, record, **do not proceed**."* Before this act, the designated-blob limb was engaged for
items 10 and 12 (`10/12` exact).

**This act clears the designated-blob limb of §8.2 only, and only for items 10 and 12** (ruling
`A-Q6`). It does **not** clear, narrow, re-interpret or waive any other §8.2 limb. In particular the
**basis** limb is untouched: the act's compiled basis remains
`BASIS_COMMIT` `5fc74085ade980846ff4a07b36415b6d49446486` / `BASIS_TREE`
`7226ef0033b3a7049169d8fcf9bcbc9908e2590b`, and any checkout whose basis differs from those constants
still triggers §8.2 exactly as before. The host, Node-version, P-1-condition, pre-existing-row,
identity-value, V-A2 and store-repair limbs are all unchanged.

## 5. Scope preserved — what this act does **not** do

- **No code change.** No source, test, script, migration, schema, package manifest, lockfile,
  `tsconfig`, `vite.config`, CI workflow or IRR path is modified. `A-O5` is expressly **not**
  adopted, so neither `4a005b73…` nor `9a5fd9e3…` is restored.
- **No unrelated authorization.** This act does not authorize any code change, any future edit to
  `portfolio_store.ts` or `tests/g3_startup_validation.test.ts`, or any change to the other ten
  designated items. It re-designates two blob identities and nothing else.
- **No broadening of the PA decision.** The act applies the recorded rulings verbatim; it adds no
  condition, exception or interpretation beyond them.
- **No compiled-basis change.** `BASIS_COMMIT`, `BASIS_TREE` and the three identity constants are
  unchanged in value and meaning.
- **No execution.** Nothing is provisioned. Gate A′ provisioning remains **`NOT AUTHORIZED`**; no
  pin is designated or consumed by this act.
- **Not the S1 pointer correction.** The separate prompt `IPD-S1` (pointer correction of
  determination §12.2 under `A-GAP1`) is a **different** act and is **not** performed here.
- **No IRR write.** IRR records the executed result in a separate pass.

## 6. Standing statuses — unchanged by this act

**P-1-C NOT ESTABLISHED. P-1-D DESIGNATED, NOT VERIFIED FOR THE ATTEMPT. P-1 NOT EXECUTED / UNSPENT
/ NOT AUTHORIZED.** Gate 4 remains **`AUTHORIZED — NOT STARTED`**; `H-12` remains **`NOT ADOPTED`**;
Gate 5 admission remains **not granted**; operational writes remain **denied**; `SESSION_ONLY` /
`durable:false` unchanged.

Designation B (the P-1 coordinate at `a891802e`) remains **not effective for reliance**: per the PA
designation record §2 it becomes effective only when Matter A closes **and** fresh S2 and H-12
evidence at `a891802e` exist. This act supplies the first of those two conditions and claims neither.

## 7. Matter A closure

Matter A closes when this act is executed on IPD `main` **and** recorded in IRR. This instrument is
the IPD half. The IRR half is a separate pass and is not performed here.

## 8. Effectiveness

This act is **`RENDERED — NOT EFFECTIVE`** until this exact content is merged to
`ramkivs/iips-production-market-data` `refs/heads/main` with green exact-head CI, green post-merge
CI, and independent remote read-back of the amended designation list. The publication receipt is
recorded in the IPD execution tracker.
