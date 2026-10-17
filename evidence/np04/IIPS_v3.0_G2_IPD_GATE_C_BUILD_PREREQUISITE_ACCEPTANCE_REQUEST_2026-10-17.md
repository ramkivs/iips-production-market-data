# IIPS v3.0 — G-2: **GATE C BUILD PREREQUISITE — ACCEPTANCE DECISION REQUEST**

> ## STATUS: **PROPOSED — NOT YET AUTHORIZED — NOT A PA DECISION**
> This artifact **requests** a disposition on **one** question: how procedure §4.7(4) — *"Build
> succeeds with the existing scripts"* — is to be satisfied at the pinned commit. It **records no
> decision**, **waives nothing**, **reclassifies no failure as a success**, and **accepts no Gate C
> result**. Until the Authority renders it, §4.7(4) remains **UNSATISFIED as written** and Gate C
> cannot lawfully run.

| Field | Value |
|---|---|
| **Request identifier** | `IIPS-V3-G2-IPD-GATE-C-BUILD-PREREQUISITE-ACCEPTANCE-REQUEST-2026-10-17-01` |
| **Act type** | DECISION-REQUEST (preparation only — not an authority act, not a waiver, not an implementation, not a qualification) |
| **Prepared by** | Arena (Recording Agent only); **rendered by no authority** |
| **Decision-maker required** | **Ramki — Program Authority**, acting as the **IPD qualification authority** (the capacity that rendered D-GC-A…I and adopted the procedure under D-GC-E1) |
| **Question addressed** | **only** procedure §4.7(4) at `cec7080`. **No other prerequisite, check, fixture or result** |
| **Repository / branch (this record)** | `ramkivs/iips-production-market-data` / `arena/21c63aef-iips-production-market-data` (existing **PR #8** workstream, open, unmerged) |
| **Independence** | This request **does not** authorize store provisioning, does **not** declare a store available, does **not** substitute for Windows execution, and does **not** accept any Q-check result. The Gate A′ request **does not** waive this prerequisite |
| **Recorded at** | 2026-10-17 (Asia/Calcutta) |

---

## 1. THE PREREQUISITE AS WRITTEN

| Source | Text |
|---|---|
| Procedure `IIPS-V3-G2-IPD-GATE-C-QUALIFICATION-PROCEDURE-2026-10-17-01`, §4.7 item 4 | *"**Build succeeds with the existing scripts; no repository file changed.**"* |
| Rendered act, D-GC-E2 / §5.5 approved build pattern | *"Build — The **existing** compiler invocation (`npx tsc`) — **no new script**"*; binding prohibitions: *"`package.json` must not be modified… `tsconfig.json` must not be modified… No repository implementation file may be modified… No repository runner may be added or implemented."* |
| Rendered act, §4 D-GC-E1 | The procedure is adopted **"as published, without amendment"** |

**The text contains an internal tension that only the Authority can resolve:** §4.7(4) speaks of the
*"existing scripts"* (the repository's `build` script is `tsc && vite build`), while D-GC-E2's
approved pattern names the *"existing compiler invocation (`npx tsc`)"*. At the pinned commit the two
produce **different exit codes** (§2.1). Whatever is decided must say which command the criterion
applies to — otherwise two operators can satisfy it differently.

---

## 2. VERIFIED TECHNICAL FACTS (re-measured this round on the pinned commit)

Environment: `gate-b/local-principal-ipc-implementation` @ `cec7080252183a6a5332efe351e61c254d342a2d`
(tree `22a7438bc41e5b9853700c5a3737702898da8c53`), clean checkout, `npm ci` exit **0** (36 packages),
TypeScript **5.9.3** (locked), Node v22.22.3, POSIX. **This is Arena evidence and is non-qualifying
for Gate C (D-GC-F); it establishes the mechanism, not the host result.**

### 2.1 Exit codes and outputs

| Command | Exit | Output |
|---|---|---|
| `npm ci --no-audit --no-fund` | **0** | 36 packages installed |
| `npx tsc --noEmit` | **2** | exactly **4** diagnostics (§2.2) |
| `npx tsc` | **2** | the same 4 diagnostics; **`dist/` emitted in full** |
| `npm run build` (`tsc && vite build`) | **2** | tsc gate fails ⇒ **`vite build` never runs** |
| `npx vite build` (run directly) | **0** | bundle produced |

### 2.2 The four diagnostics, verbatim

```
tests/wsi_iu1_pit_series_aware_keying.test.ts(104,3): error TS2322: Type 'CanonicalEnvelope<{...
}>' is not assignable to type 'CanonicalEnvelope<OHLCVCandle>'.
  Property 'interval' is missing in type '{...}' but required in type 'OHLCVCandle'.
tests/wsj_iu3_pit_read_boundary.test.ts(302,18): error TS2345: Argument of type
'CanonicalEnvelope<MarketQuotePayload>' is not assignable to parameter of type
'CanonicalEnvelope<OHLCVCandle>'.
  Type 'MarketQuotePayload' is missing the following properties from type 'OHLCVCandle':
  interval, candleStart, candleEnd, isAdjusted
tests/wsj_iu3_pit_read_boundary.test.ts(311,18): error TS2345: (same as above)
tests/wsj_iu3_pit_read_boundary.test.ts(315,54): error TS2339: Property 'ltp' does not exist on
type 'OHLCVCandle'.
```

No error appears in `src/`, in the frontend, or in any of the fifteen Gate B files.

### 2.3 The two files are pre-existing and Gate B did not touch them

| Fact | Value |
|---|---|
| `tests/wsj_iu3_pit_read_boundary.test.ts` blob at `2ded0e9` (gate-a) | `e5598cd7eed81f5800f6440e647711099aa24a51` |
| … blob at `cec7080` (gate-b) | **identical** — `e5598cd7…` |
| `tests/wsi_iu1_pit_series_aware_keying.test.ts` blob at both | **identical** — `2678ad63e93820a7b7ae7fae5c50fc26850adb0e` |
| Files touched by the Gate B diff (`2ded0e9..cec7080`) among these | **0 of 2** |
| Introduced | `07613b5` — 2026-09-28, "IU-3: IPD PIT read boundary…" |
| Present on `main` | **no** — neither file exists on `main`; the lineage carries them |

### 2.4 Causality: the four diagnostics do not touch any emitted runtime artifact

This is the decisive measurement. A **scratch copy outside the repository** of the pinned tree was
made; **only** the two named test files were deleted from that copy; it was compiled with the same
`npx tsc` and the same `node_modules`.

| Measurement | Result |
|---|---|
| `npx tsc` in the scratch copy | **exit 0** |
| Compiler output | **no diagnostics** |
| `dist/src/**` file count, both builds | **644 / 644** |
| Files differing byte-for-byte | **0** |
| Files present in only one build | **0** |
| `dist/src/ipc/*.js` (all six: `endpoint`, `entrypoint`, `errors`, `framing`, `index`, `server`) | **byte-identical**, e.g. `entrypoint.js` = `6b65117f086df5f6521dee7e9edbdbc5e75d3adb61ba08b87ffe09a992aaa310` |

**Reading:** the four errors suppress **nothing** and alter **nothing** in the emitted runtime
output. They are a defect of the *exit status*, not of the *build product* — because `noEmitOnError`
is not set, TypeScript emits everything and then reports failure.

**The limit of that reading, stated honestly:** excluding files from a compilation is **not** the
same as the build succeeding. §2.4 proves causation; it does not create authority to redefine the
criterion. That is exactly what this request asks the Authority to decide.

### 2.5 The repository CI does not cover this tree — and green CI is not evidence here

| Fact | Value |
|---|---|
| PR #8 head | `c9c80a3be33830bd21bb12bdef4700d126f701a2`; CI run `39041587902` — **success**, typecheck ✓, build ✓, **556 executed / 0 failed** |
| `src/ipc/**` files at that head | **0** |
| `tests/wsj_iu3_pit_read_boundary.test.ts` at that head | **absent** |
| `cec7080` ancestry of PR #8 head | **not an ancestor** — the Gate B branch and PR #8's branch are different lineages |

**Therefore: the green CI run says nothing about the pinned tree.** Neither the fifteen Gate B files
nor these two test files are compiled by any CI job. Any statement of the form "CI is green, so the
build is fine" would be false. (Conversely, the green run is genuine evidence for **its own** tree,
and is unaffected by this request.)

### 2.6 Nothing was changed to produce these results

The pinned tree is still `22a7438c…`; `git status --porcelain` was empty before and after; no source,
test, `package.json`, `tsconfig.json` or configuration file was edited; the scratch copy lives
outside the repository and is discarded. `package.json` and `tsconfig.json` are byte-identical
between `2ded0e9` and `cec7080`.

### 2.7 The same condition exists at the Gate A′ basis

`npx tsc` at `2ded0e9` also exits **2** with the **same four** diagnostics and still emits
`dist/src/gate_a/provision.js`. This is recorded here so the two questions are not conflated: the
Gate A′ request treats the four diagnostics as an **expected build condition of its tool**, not as a
waiver of §4.7(4).

---

## 3. THE TWO ROUTES

### 3.1 Route B — bounded repair (what it would actually cost)

A repair means editing the two test files so the payload types satisfy `OHLCVCandle` (`interval`,
`candleStart`, `candleEnd`, `isAdjusted`) — roughly four call sites.

| Consequence | Effect |
|---|---|
| Repository change required | **yes** — but D-GC-E2 forbids changing `package.json`, `tsconfig.json` or any implementation file, and Gate C's §4.7(4) itself requires *"no repository file changed"* |
| Authority required | an **implementation** act over two **delivered** IU test suites — a capacity this session does not hold, and one the standing constraints forbid exercising unilaterally |
| Tree identity | the commit would change ⇒ `cec7080` / `22a7438c…` is **no longer the pinned tree** ⇒ the Gate C act's "implementation under qualification", the Q11 digest set, and the procedure's §4.7(3) all require **re-rendering** |
| Blast radius | a new Gate B commit, a new pin, a re-issued Gate C act, a re-frozen Q11 manifest, a re-issued runbook |

**Assessment: Route B is not the smaller act.** It is a larger, cascading change that invalidates
the very identity the qualification is anchored to. It remains available to the Authority as a
first-class option (§8), but it cannot be executed under existing authority.

### 3.2 Route A — clarification/exception (who may render it)

| Question | Finding |
|---|---|
| Can §4.7(4) be clarified? | **Only by the Authority that adopted it.** D-GC-E1 adopted the procedure *"as published, without amendment"*; the criterion is part of that adopted text |
| Is there a delegation permitting an agent to render it? | **No.** No delegation to any agent or role appears in any governance record of this programme; every rendered act names Ramki as the authority. The Recording Agent cannot render, and must not infer one |
| Does Route A keep the pinned tree intact? | **Yes** — it changes the *reading of an exit status*, not the tree; Q11's digest set is untouched |
| Does Route A weaken any runtime criterion? | **No** — every Q-check still runs against the same artifacts, and the exception covers only the compiler's exit code |

### 3.3 Recommendation (a recommendation, not a decision)

**Route A, in its narrowest form (rule B-GC-1 below), executed with host-side self-verification.**

Reasons, each traceable to the evidence: the runtime artifact set is provably unaffected (§2.4); the
pinned tree stays byte-identical, so no re-render cascade is triggered (§3.1); the criterion that
actually protects qualification — *the code under test is the published build of the pinned tree* —
is preserved and made checkable; and the exception is narrow enough to fail closed on any change.

### 3.4 Variants considered and **not** proposed

| Variant | Why rejected |
|---|---|
| A2 — define the build as a test-excluded invocation (new flag or a temporary `tsconfig`) | Creates a **new build invocation**, which D-GC-E2 prohibits absent amendment; it would also make the host build differ from the recorded one |
| A3 — simply record exit 2 and continue, without conditions | That is the silent relaxation the programme forbids; it would let a genuine regression hide behind a known defect |
| A4 — treat `npx vite build` alone as "the build" | The frontend bundle is not what Gate C exercises, and `vite build` was never the build of record |
| A5 — accept the Arena POSIX measurents as the build evidence | D-GC-F: POSIX evidence is non-qualifying; the host must measure its own build |

---

## 4. PROPOSED RULE B-GC-1 (text for rendering — the Authority may change any line)

> **B-GC-1 — Build acceptance for Gate C at `cec7080`.**
>
> **1.** The build of record is the existing compiler invocation **`npx tsc`**, run in a clean
> checkout of `cec7080252183a6a5332efe351e61c254d342a2d` (tree `22a7438bc41e5b9853700c5a3737702898da8c53`).
> `npm run build` is **also** run and its exit code and complete output recorded, but its exit status
> is **not** the criterion.
>
> **2.** The prerequisite §4.7(4) is **SATISFIED UNDER EXCEPTION B-GC-1** only if **all** of the
> following hold **on the Windows host, in the same session as the qualification run**:
>
> **(a)** `git rev-parse HEAD` = `cec7080…`, `git rev-parse HEAD^{tree}` = `22a7438c…`;
> `git status --porcelain` empty **before and after** every build.
>
> **(b)** `npm ci --no-audit --no-fund` exits **0** and `better-sqlite3` loads.
>
> **(c)** `npx tsc` emits `dist/src/ipc/entrypoint.js`.
>
> **(d)** The compiler's complete diagnostic output consists of **exactly four** diagnostics, each of
> the form `tests/<one of the two named files>(<line>,<col>): error TS<2322|2345|2339>`, all four in
> `tests/wsi_iu1_pit_series_aware_keying.test.ts` (1) and `tests/wsj_iu3_pit_read_boundary.test.ts`
> (3), with **no** other error, no other file, and no other `TS` code.
>
> **(e)** The host reproduces the causality check: a scratch copy of the tree **outside the
> repository**, with **only** those two test files removed, compiles with `npx tsc` to **exit 0**,
> and every file under `dist/src/**` is **byte-identical** to the same file produced by (c).
> Any missing file, any extra file, or any differing byte ⇒ **condition fails**.
>
> **(f)** `npx vite build` exits **0**.
>
> **(g)** No repository file changed: the Q11 digest set (15 implementation files +
> `package.json` + `tsconfig.json`) is identical before and after, and `git status --porcelain`
> remains empty.
>
> **3.** If **any** condition in (2) fails, the build prerequisite is **NOT satisfied**. The run is
> **INVALID** — not FAILED, not re-run silently — and the discrepancy is reported with the raw
> output.
>
> **4.** The disposition must be recorded as **"§4.7(4) SATISFIED UNDER BUILD EXCEPTION B-GC-1"**,
> together with the four diagnostics and the artifact hashes. It must **never** be recorded as an
> ordinary build success, and **never** as a build that exited 0.
>
> **5.** Condition (2)(d) may not be satisfied by the operator "fixing" the files, editing
> `tsconfig.json`, adding a build flag, or adding a runner — all four are prohibited by D-GC-E2 and
> would void the exception.
>
> **6.** This exception covers **only** the compiler exit status at `cec7080`. It does not waive any
> other build, type, test, drift, or runtime criterion, and it accepts **no** Gate C result.

---

## 5. WHAT THIS RULE WOULD NOT DO

It would not change any repository file; would not alter the pinned commit or tree; would not modify
the Q11 digest set; would not weaken any Q-check, fixture rule, or acceptance criterion; would not
convert the four errors into "passing tests"; would not authorize Gate C to run without a store;
would not accept, predict, or imply any qualification result; and would not authorize PR #8's merge,
any tag, promotion, admission, or production use.

---

## 6. EVIDENCE REQUIRED ON THE HOST (if B-GC-1 is rendered)

| # | Artifact |
|---|---|
| 1 | `git rev-parse HEAD` and `HEAD^{tree}`; `git status --porcelain` before/after (empty) |
| 2 | `npm ci` log and exit code; `node -v`, `npm -v`, `npx tsc -v` |
| 3 | `npx tsc` full stdout/stderr and exit code |
| 4 | `npm run build` full stdout/stderr and exit code |
| 5 | `npx vite build` full stdout/stderr and exit code |
| 6 | `sha256` of every `dist/src/**` file from both builds, and the diff result (must be empty) |
| 7 | Q11 digest manifest before and after (identical) |
| 8 | The four diagnostics, copied verbatim (path separators normalised in the comparison, preserved in the raw log) |

---

## 7. THE DECISION SOUGHT

> I, Ramki, as Program Authority and IPD qualification authority, decide on
> `IIPS-V3-G2-IPD-GATE-C-BUILD-PREREQUISITE-ACCEPTANCE-REQUEST-2026-10-17-01`:
> **RENDER B-GC-1** (build accepted under exception, with all conditions of §4), **or**
> **AMEND B-GC-1 as follows: `<text>`**, **or** **REJECT B-GC-1 and direct Route B (bounded
> repair)** — in which case §4.7(4) remains unsatisfied and the pinned tree, the Gate C act's
> implementation identity, and the Q11 digest set must all be re-rendered before any Gate C run —
> **or** **DEFER**, in which case Gate C cannot run and this prerequisite remains open.
> I record that this decision covers **only** procedure §4.7(4) at `cec7080`; that it grants no
> store, no fixture, no Windows execution, no Q-check acceptance, no ref or tag movement, no PR #8
> merge, and no production authority; and that it does **not** waive any other prerequisite.

---

## 8. IF THE AUTHORITY PREFERS REPAIR — THE MINIMUM, PRICED

| Step | Content |
|---|---|
| 1 | An implementation act for **exactly** the four call sites in the two test files (add `interval`/`candleStart`/`candleEnd`/`isAdjusted` to the D02 payloads; use the quote payload type for the `ltp` assertions) — **no** production source change |
| 2 | A new commit on `gate-b`, a new published commit + tree identity |
| 3 | Re-render of the Gate C act's "implementation under qualification" and of procedure §4.7(3) |
| 4 | Re-freeze of the Q11 digest set and of the harness expectations that name `cec7080` |
| 5 | Re-issue of the Windows runbook's checkout command |

Nothing in step 1 has been performed, and **nothing may be**, until such an act is rendered.

---

## 9. RESIDUAL AUTHORITY BLOCKER

**The blocker is now precise and singular:** the Authority's rendering — either of B-GC-1 or of a
bounded repair act. No agent, role, green CI run, adoption of the procedure, or general one-pass
instruction supplies it. Until it is rendered, procedure §4.7(4) is **UNSATISFIED**, Gate C remains
**unexecuted**, and this request remains **PROPOSED**.
