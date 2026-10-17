# IIPS v3.0 — G-2: **GATE C BUILD PREREQUISITE — B-GC-1 — PA DECISION RECORD — RENDERED**

> ## STATUS: **RENDERED — B-GC-1 = `ADOPTED` — NO WINDOWS-HOST RUN HAS OCCURRED OR BEEN ACCEPTED**
> The Program Authority's disposition on the build-prerequisite request is recorded here. **Rule
> B-GC-1 is adopted** for procedure §4.7(4) at the pinned commit. **No build has been accepted by
> this record**: the exception applies only when the operator reproduces every condition on the
> Windows host and documents it. §4.7(4) remains **UNSATISFIED IN FACT** until that happens.

| Field | Value |
|---|---|
| **Act identifier** | `IIPS-V3-G2-IPD-GATE-C-BUILD-EXCEPTION-PA-DECISION-2026-10-17-01` |
| **Artifact type** | **Rendered PA decision record** (records the Authority's disposition; recording only — no build run, no Gate C result) |
| **Authority** | **RAMKI — Program Authority**, acting as the **IPD qualification authority** for `ramkivs/iips-production-market-data` (the capacity that rendered `IIPS-V3-G2-IPD-GATE-C-QUALIFICATION-AUTHORITY-2026-10-17-01`) |
| **Rendered** | 2026-10-17 (Asia/Calcutta) |
| **Channel** | the **G-2 task channel** for this workstream; recorded here as such |
| **Disposition** | **`ADOPTED`** — rule **B-GC-1** governs §4.7(4) at `cec7080` |
| **Governing request (byte-preserved, not modified)** | `IIPS-V3-G2-IPD-GATE-C-BUILD-PREREQUISITE-ACCEPTANCE-REQUEST-2026-10-17-01` — `evidence/np04/IIPS_v3.0_G2_IPD_GATE_C_BUILD_PREREQUISITE_ACCEPTANCE_REQUEST_2026-10-17.md` — commit `d60c9be0477ec192d64c5491a9fb2c49bc1e283c`, blob `b9cfee01d6dd855f7116622c7f955824bc2f01e4`, sha256 `5038ce0585b069e85a51a0309bd839c5a9f1822e268a786cf18ce0fd0bc39795`, 18 030 bytes |
| **Governing procedure** | `IIPS-V3-G2-IPD-GATE-C-QUALIFICATION-PROCEDURE-2026-10-17-01` — blob `a263a05ca45e7304f016013ce78a338808ab04c0` — **§4.7(4)**, adopted under D-GC-E1 |
| **Pinned implementation** | `cec7080252183a6a5332efe351e61c254d342a2d`, tree `22a7438bc41e5b9853700c5a3737702898da8c53` |
| **Repository / branch (this record)** | `ramkivs/iips-production-market-data` / `arena/21c63aef-iips-production-market-data` (existing **PR #8** workstream, open, unmerged) |
| **Execution status** | **NO QUALIFYING RUN** — Arena evidence is non-qualifying (D-GC-F); the host run is outstanding |
| **Production status** | NON_PRODUCTION |

---

## 1. EFFECT OF THIS DECISION

```
RULE B-GC-1 = ADOPTED   ·   RECORDED OUTCOME (only on host satisfaction) = "§4.7(4) SATISFIED UNDER BUILD EXCEPTION"
                          ·   ORDINARY BUILD SUCCESS = NEVER RECORDED
```

**Rule B-GC-1 is adopted** as the only lawful way to treat procedure §4.7(4) as satisfied at the
pinned commit. It is an **exception with conditions**, not a waiver: the compiler command exits **2**,
and **that exit code is never recorded as a successful build**. The prerequisite counts as satisfied
**only** when the Windows host reproduces every condition in §3 and the evidence of §4 exists.

**Nothing about Gate C changes today.** No build has been accepted; no check may run on the strength
of this record alone.

---

## 2. SOURCE, CAPACITY AND RECORDING DISCIPLINE

### 2.1 The disposition

The Program Authority directed, in the G-2 task channel on 2026-10-17, that **B-GC-1 be rendered** as
a **separate** decision — not bundled with Gate A′ — preserving the distinction that **a TypeScript
exit code of 2 is not an ordinary successful build**, that the prerequisite may be treated as
satisfied **only** under the exception when every required Windows-host condition is independently
reproduced and documented, that the recorded outcome must read **`§4.7(4) SATISFIED UNDER BUILD
EXCEPTION`**, that **any deviation makes the run `INVALID`**, and that the exception is not broadened
to any other error.

### 2.2 On the claimed standing authorization — recorded accurately

As with the Gate A′ rendering, **no global or standing authority instrument exists in the repository**
(a full search of `evidence/np04/` returns none), and this record does not rely on one. **The
rendering rests on the specific disposition in §2.1** — the same channel mechanism by which
`IIPS-V3-G2-IPD-GATE-C-QUALIFICATION-AUTHORITY-2026-10-17-01` and the Gate A decision were rendered.

### 2.3 What this record is, and is not

| This record **is** | This record **is not** |
|---|---|
| The durable record of the Authority's rendered decision | A new decision, or an interpretation of one |
| The operative rule for §4.7(4) at `cec7080` | A build success, or a record that the build passed |
| Additive documentation on the existing PR #8 workstream | A modification of the procedure or of the pinned tree |
| Independent of Gate A′ | A store authorization, or a Gate C result acceptance |

### 2.4 The request is preserved, not rewritten

The request (`d60c9be`, blob `b9cfee01…`, sha256 `5038ce05…`) remains **byte-unchanged**; its
`PROPOSED — NOT YET AUTHORIZED` banner is **not** edited. This record supersedes it **for effect
only**.

---

## 3. THE RENDERED RULE — B-GC-1

> **B-GC-1 — Build acceptance for Gate C at `cec7080`.**
>
> **1. Build of record.** The build is the **existing compiler invocation `npx tsc`** in a clean
> checkout of `cec7080252183a6a5332efe351e61c254d342a2d` (tree
> `22a7438bc41e5b9853700c5a3737702898da8c53`). `npm run build` is **also** run and its exit code and
> complete output recorded, but its exit status is **not** the criterion.
>
> **2. The eight conditions.** §4.7(4) is **SATISFIED UNDER BUILD EXCEPTION** only if **all** of the
> following hold **on the Windows host, in the same session as the qualification run**:
>
> | # | Condition |
> |---|---|
> | **C1** | `git rev-parse HEAD` = `cec7080…` and `HEAD^{tree}` = `22a7438c…`; `git status --porcelain` **empty before and after** every build |
> | **C2** | `npm ci --no-audit --no-fund` exits **0**; `better-sqlite3` loads |
> | **C3** | The required entrypoint `dist/src/ipc/entrypoint.js` **is emitted** |
> | **C4** | The compiler's **complete** diagnostic output is **exactly four** `error TS` entries — **three** in `tests/wsj_iu3_pit_read_boundary.test.ts` and **one** in `tests/wsi_iu1_pit_series_aware_keying.test.ts` — with **no additional diagnostic**, no other file, and no other `TS` code |
> | **C5** | The **scratch-copy causality check** succeeds: a copy of the tree **outside the repository**, with **only** those two test files removed, compiles with `npx tsc` to **exit 0** |
> | **C6** | Every emitted file under `dist/src/**` is **byte-identical** between the C1 build and the C5 build — **no missing file, no extra file, no differing byte** |
> | **C7** | `npx vite build` exits **0** |
> | **C8** | The **Q11 digest set** (15 implementation files + `package.json` + `tsconfig.json`) is **identical before and after** |
>
> **3. Deviation ⇒ INVALID.** If **any** condition fails, the build prerequisite is **NOT satisfied**.
> The run is recorded **`INVALID`** — not FAILED-but-acceptable, not "close enough", and **never**
> silently re-run to a pass. The discrepancy is reported with the raw output.
>
> **4. Exact recorded outcome.** On full satisfaction the disposition is recorded **verbatim** as:
>
> > **`§4.7(4) SATISFIED UNDER BUILD EXCEPTION`**
>
> together with the four diagnostics and the artifact hashes. It must **never** be recorded as an
> ordinary build success, as a passing typecheck, or as a build that exited 0.
>
> **5. No repair inside the run.** C4 may not be satisfied by editing the two test files, editing
> `tsconfig.json`, adding a compiler flag, or adding a runner. All four are prohibited by D-GC-E2 and
> would void the exception.
>
> **6. Narrow scope.** The exception covers **only** the compiler exit status at `cec7080`. It waives
> no other build, type, test, drift, or runtime criterion, and accepts **no** Gate C result.

---

## 4. THE EVIDENCE THE HOST MUST PRODUCE

| # | Artifact |
|---|---|
| 1 | `git rev-parse HEAD` / `HEAD^{tree}`; `git status --porcelain` before and after (empty) |
| 2 | `npm ci` log and exit code; `node -v`, `npm -v`, `npx tsc -v` |
| 3 | `npx tsc` full stdout/stderr and exit code |
| 4 | `npm run build` full stdout/stderr and exit code |
| 5 | `npx vite build` full stdout/stderr and exit code |
| 6 | `sha256` of every `dist/src/**` file from both builds, plus the diff result (must be empty) |
| 7 | Q11 digest manifest before and after (identical) |
| 8 | the four diagnostics verbatim (raw log preserved; path separators normalised only in the comparison) |

---

## 5. WHAT THIS DECISION DOES NOT DO

It does **not** authorize store provisioning or declare a store available; it does **not** claim that
a qualifying Windows-host run has occurred; it does **not** change the pinned tree, the implementation
under qualification, or the Q11 digest set; it does **not** waive any unrelated build, type, test, or
runtime requirement; it does **not** authorize PR #8's merge, any tag, ref movement, promotion,
admission, CV-52, or production use; and it does **not** establish Gate C result acceptance or any
downstream admission.

---

## 6. EVIDENCE CARRIED FROM THE REQUEST (verified there; not re-run here)

| Fact | Value | Where verified |
|---|---|---|
| `npx tsc --noEmit` at `cec7080` | exit **2**, exactly four diagnostics | request §2.1–§2.2 |
| `npx tsc` at `cec7080` | exit **2**, `dist/` emitted in full | request §2.1 |
| `npm run build` | exit **2** (tsc gate; vite not reached) | request §2.1 |
| `npx vite build` alone | exit **0** | request §2.1 |
| The two test files | blob-identical at `2ded0e9` and `cec7080`; Gate B touched neither; introduced `07613b5` (2026-09-28) | request §2.3 |
| Causality measurement | scratch copy minus the two files → `npx tsc` exit **0**; **644 / 644** `dist/src` files byte-identical; zero differing, zero missing, zero extra | request §2.4 |
| PR #8 CI | run `39041587902` success (556/0) — but that tree contains **zero** `src/ipc` files and **neither** test file, and `cec7080` is **not** an ancestor: **CI green is not evidence about this tree** | request §2.5 |
| Repository change | **none** — tree still `22a7438c…` | request §2.6 |

These are **Arena/POSIX measurements** and are explicitly **non-qualifying** for Gate C (D-GC-F).
They establish the *mechanism*; the **host** must reproduce it. The rule exists precisely because a
non-qualifying measurement may not be promoted into a qualifying one.

---

## 7. INDEPENDENCE

| Instrument | Scope | Relationship |
|---|---|---|
| `IIPS-V3-G2-IPD-GATE-A-PRIME-PA-DECISION-2026-10-17-01` | one store provisioning | **independent** — B-GC-1 neither provisions a store nor depends on one |
| **this record** | procedure §4.7(4) only | — |
| Gate C qualification act | Q1–Q4/Q9–Q11 | untouched; its results remain unaccepted |

Neither instrument implies the other, and neither makes Gate C runnable on its own.

---

## 8. ATTESTATION

| Claim | Value |
|---|---|
| Rule adopted | **YES** — B-GC-1 |
| Build executed by this record | **NO** |
| Qualifying Windows-host run | **NO** — none has occurred |
| §4.7(4) satisfied in fact | **NO** — conditional on C1–C8 |
| Gate C result accepted | **NO** |
| Pinned tree or Q11 set changed | **NO** |
| Store provisioned | **NO** |
| Ref, tag or PR moved | **NO** |
| IRR touched | **NO** |
| Reliance on an unrecorded blanket authority | **NO** — see §2.2 |

---

## 9. DURABILITY

Published as additive documentation in the existing PR #8 workstream (`evidence/np04/`), committed
and pushed with one non-forced push, and verified remotely by path, commit, blob and sha256 with a
byte-identity read-back. The publication verification is appended after publication.

---

## 10. PUBLICATION AND REMOTE VERIFICATION (appended 2026-10-17)

**Content commit:** `e9e3b3b32fb7dabb75455077e8abbd9f325a3f3a` — parent
`d60c9be0477ec192d64c5491a9fb2c49bc1e283c`, tree
`4764e71206cd7b97c6a93e989c80d1f64a447216`.

| Artifact | Remote blob | Bytes | sha256 (remote = local) | Byte identity |
|---|---|---|---|---|
| this record | `8c10885ae5b3b3fd8b7760d7f5490a5649517be5` | 11 799 | `0cac32675443c71819b874edf888f5c9aa8d6044ee165cf0dee631897acf7690` | **IDENTICAL** (API read-back) |
| Gate A′ decision | `084d784484ed482bed6dc5dbca16ec5f5fc0cbdb` | 16 539 | `efd8e0625990293e77dbef2971a7ad307c9aa504198426d8d227898ce2d4a92b` | **IDENTICAL** |

CI on the content commit: run **`39050146649`** — **success**, **556 executed / 0 failed**. PR #8:
**OPEN, unmerged**, head `e9e3b3b…`.

This section is appended by a **subsequent** commit, so the record's own identity is not
self-referential.

---

*End of rendered decision `IIPS-V3-G2-IPD-GATE-C-BUILD-EXCEPTION-PA-DECISION-2026-10-17-01` —
**B-GC-1 ADOPTED**, **no Windows-host run occurred or was accepted** · NON_PRODUCTION.*
