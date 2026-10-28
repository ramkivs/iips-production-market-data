# CAP-03 — IPD-S1 Pointer Act 01: `act §6 row S1` governs S1; determination §12.2 `12/12` does not reproduce — **RENDERED — EFFECTIVE ON PUBLICATION**

> ## STATUS: **RENDERED — EFFECTIVE ONLY ON PUBLICATION TO IPD `main` · RECORDS A PA RULING ALREADY RENDERED · RENDERS NO NEW DECISION · DESIGNATES NOTHING · EXECUTES NOTHING · CHANGES NO GATE STATUS**
>
> **Until this exact content is merged to `ramkivs/iips-production-market-data` `refs/heads/main` with
> green CI and remote read-back, this instrument is `RENDERED — NOT EFFECTIVE`.**
>
> This is the separate IPD-side instrument executing prompt **`IPD-S1`** under the Program Authority
> ruling **`A-GAP1` — act row S1 governs over determination §12.2**. It is a **documentation
> pointer**. It adds a dated pointer under determination §12.2 and does **not** rewrite §12.2 in
> place. It does **not** re-designate any blob, **does not** substitute for or duplicate the
> completed `A-Q5` amendment, and **does not** alter the Gate 4 act or the Gate A′ act.

| Field | Value |
|---|---|
| Record ID | `IIPS-V3-CAP03-S1-POINTER-ACT-01-2026-10-28-01` (census before publication: `0` occurrences in this repository) |
| Instrument type | Dated documentation pointer act — records a PA ruling already rendered; additive only |
| Prompt executed | `IPD-S1` — pointer correction of determination §12.2, `docs/integration/IIPS_v3.0_CAP03_IPD_PROMPT_S1_POINTER_2026-10-28.md`, IRR blob `d6d4fbe658d0c172c1f79e59705728c7b047ff2d` (1,200 bytes), carried on IRR PR #353 head `caca0213162f220edfdfc3e0f37b580e6c77d829` |
| Ruling applied | **`A-GAP1`** — act row S1 governs over determination §12.2 |
| Document pointed at | `IIPS-V3-CAP02-S1-IDENTITY-VALUE-DETERMINATION-2026-10-24-01`, `evidence/cross-repository/IIPS_V3_CAP02_S1_IDENTITY_VALUE_DETERMINATION_EFFECTIVE_2026-10-24.md`, §12.2 (pre-amendment blob `b7746b5ed955abcf689ec57ca4a0748c0241ed09`, §12.2 at lines 328–334) |
| Governing text identified | `IIPS-V3-G4-TARGET-HOST-QUALIFICATION-AUTHORITY-ACT-2026-10-23-01`, §6 *"Q5 — Required execution ordering and dependencies"*, row **S1** (act line 196) |
| Date | `2026-10-28` (UTC) — actual date, not backdated |

---

## 1. The separate IPD authority relied upon (confirmed before writing)

The prompt's first prerequisite requires that IPD authority for a documentation pointer be **held
separately** and be confirmed before writing. It is, and it is independent of both the `A-GAP1`
ruling and the completed `A-Q5` amendment:

| Element | Identity | What it grants |
|---|---|---|
| Standing grant **F-3 §1.2** | IRR blob `c4c9f7d79ef181af96f6c4e5cc108288ef22fd02`, transcribed verbatim at `IIPS_V3_CAP02_SUCCESSOR_EXECUTION_AUTHORITY_RECONCILIATION_AND_DESKTOP_EVIDENCE_2026-10-23.md` §2 | *"…covers the necessary decisions, governance records, implementation, testing, corrections, and publication **within the established scope**. Do not request repeated approval for individual decisions or routine implementation steps."* |
| Construction **DEC-06** | `IIPS-V3-DEC06-AUTHORITY-RECONCILIATION-IRR-2026-10-21-01`, IRR blob `4be3ea578a51a1a949337e5d218b89841c04892d` | **R-1** the four limits are the only textual limits; per-decision re-approval is forbidden. **R-2** established scope is set by PA product decisions and governing boundaries. **R-3** authorization ≠ act ≠ proof — the grant authorizes *making* a bounded act, the act must be its own recorded instrument, proof is remote state. §3: *later explicit acts are the operative interpretation of an earlier general grant.* |

**Why this pointer falls inside the grant and not outside it.** It is a *governance-record
correction* and *publication* — both named in F-3 §1.2. It renders **no** new decision: `A-GAP1` was
already rendered by the Program Authority, and this instrument only records where the governing text
sits (R-2 satisfied — the scope is set by the PA ruling, not by convenience). None of the four limits
is engaged: no fabricated evidence (every value below is measured), no weakened safeguard, no
unrelated scope expansion, no claim of success without verification. Per R-3 this instrument **is**
the separate recorded act, and proof is the remote state verified in §5.

This is the same authority basis the repository's other additive CAP-02 instruments cite, including
the Gate 4 act itself (its own "Authority exercised" row) and `G4-AMEND-01`.

## 2. The second prerequisite

*"The A-Q5 IPD act is executed, or this pointer explicitly defers to it."* — **Satisfied.**
`IIPS-V3-CAP02-GATE-A-PRIME-AMEND-01-DESIGNATED-BLOBS-2026-10-28-01` is executed and published at
IPD `0edadb2d128c9cf85e1522f0b7828d9e99d6d5cf` (tree `3fbcc011ee8e6f9173733aa41175d8f2f34539f1`,
amendment commit `0a8aab95bc7196876a72a30e59fec3b055f35b9a`). This pointer refers to that act and
does not recreate, amend again or duplicate it.

## 3. What the pointer states, and the measurements behind it

The pointer records two things, each measured rather than asserted.

**(a) `act §6 row S1` governs S1.** The governing text is Gate 4 act
`IIPS-V3-G4-TARGET-HOST-QUALIFICATION-AUTHORITY-ACT-2026-10-23-01` §6, row **S1**, verbatim:
*"**Gate A′ provisioning execution** on `desktop-no0nhtp` | **BLOCKED** — successor act effective,
but its identity values are **unresolved** (successor act §4) and no store exists. Gate E §4 orders
qualification *after* provisioning"*. Determination §12.2 does not govern S1.

**(b) The §12.2 `12/12` statement does not reproduce for items 10 and 12.** §12.2 asserts that
*"`12/12` of the successor act §2.1 paths resolve as designated"* and enumerates
`portfolio_store.ts 4a005b73…` and `tests/g3_startup_validation.test.ts edd0305e…`. Measured:

| # | Path | §12.2 enumerates | Act §2.1 designated (pre-amendment, still the act's text) | Actual at `1ba0740a` and at `0edadb2d` | Reproduces? |
|---|---|---|---|---|---|
| 10 | `src/persistence/portfolio_store.ts` | `4a005b737de26443e261156a3102d553dd90b726` | `4a005b737de26443e261156a3102d553dd90b726` | **`540d49f2deb2c8d600b5b866675d145cf76a1e46`** | **NO** |
| 12 | `tests/g3_startup_validation.test.ts` | `edd0305e3e5891020b2b045ab2cf082cd6cf788f` | `9a5fd9e3b22693e95304a1cd2df812bbf9ea2299` | **`edd0305e3e5891020b2b045ab2cf082cd6cf788f`** | **NO** — the act's designation, not the reality, was stale |

The other ten items reproduce. The measured result is **`10/12`**, not `12/12`. The two failures are
of different kinds and are recorded as such: item 10 diverges because the *file* moved (the DR-2
change authorized by `A-Q1`), item 12 diverges because the *act's designation* was stale (the test
was changed by `c62dee81` under the act's own §5.1 item 4 bounded modification).

**(c) Current state, stated without overstating.** Items 10 and 12 were re-designated to the actual
blobs by the `A-Q5` amendment act at `0edadb2d`, so the amended designation list now reproduces
`12/12`. That does **not** make §12.2's original sentence correct as a record of the
pre-publication baseline, and §12.2 is not corrected in place.

## 4. Scope preserved — what this act does **not** do

- **Does not rewrite determination §12.2.** §12.2's heading and paragraph are preserved verbatim;
  the pointer is appended beneath them as a clearly marked dated block.
- **Does not touch the Gate 4 act.** Blob `66b56fd1584890525a7250aadd7da449def621e5` unchanged; its
  §6 row S1 is cited, not edited.
- **Does not touch the Gate A′ act.** Blob `528de6aeddbc8e5f3191be8792f3937d77de4037` unchanged.
- **Does not re-designate any blob.** No designated value changes; §2.1 is untouched by this act.
- **Does not duplicate or re-open `A-Q5`.** No second amendment, no re-rendering.
- **Does not re-open `A-GAP1`.** The ruling is applied as recorded, at its recorded scope. No new
  contradictory authoritative evidence was found this pass, so none is offered.
- **No code, test, script, migration, schema, manifest, lockfile, `tsconfig`, `vite.config`, CI
  workflow or IRR path is changed.**
- **Changes no gate status.** S1 remains **`BLOCKED`**; Gate A′ provisioning remains
  **`NOT AUTHORIZED`**; Gate 4 remains **`AUTHORIZED — NOT STARTED`**; `H-12` **`NOT ADOPTED`**;
  Gate 5 **not granted**; operational writes **denied**; `SESSION_ONLY` / `durable:false` unchanged.
- **Not the `IPD-S1` host work.** S1 the *step* is not executed; this act only records which text
  governs it.

**P-1-C NOT ESTABLISHED. P-1-D DESIGNATED, NOT VERIFIED FOR THE ATTEMPT. P-1 NOT EXECUTED / UNSPENT
/ NOT AUTHORIZED.**

## 5. Verification performed at execution

| Assertion | Result |
|---|---|
| IPD `main` == working HEAD before the write | **PASS** — `0edadb2d128c9cf85e1522f0b7828d9e99d6d5cf`, tree `3fbcc011…`, 0 uncommitted, 0 open PRs |
| Determination §12.2 located | **PASS** — lines 328–334 of the determination; §12.3 begins at line 336 |
| Act §6 row S1 located | **PASS** — Gate 4 act line 196, inside `## 6. Q5 — Required execution ordering and dependencies` |
| The Gate A′ act has no S1 row | **PASS** — its §6 is `V-A2-1…V-A2-8`; the act contains no `S1` string at all, so §6 row S1 can only be the Gate 4 act's |
| Separate IPD documentation authority present | **PASS** — F-3 §1.2 / DEC-06 R-1/R-2/R-3, §1 above |
| Item 10 and item 12 actual blobs | **PASS** — `540d49f2…` / `edd0305e…` at both `1ba0740a` (GitHub Contents API) and `0edadb2d` (`git rev-parse`) |
| `A-Q5` amendment published | **PASS** — amend act blob `7b2c3c3b96be5a37f1a37d374462ec92cce56b1e` present at `main` |

## 6. Effectiveness

This act is **`RENDERED — NOT EFFECTIVE`** until this exact content is merged to
`ramkivs/iips-production-market-data` `refs/heads/main` with green exact-head CI, green post-merge
CI, and independent remote read-back of the pointer text. The publication receipt is recorded in the
IPD execution tracker.
