# IIPS v3.0 — `CV-25` SECOND PIN REQUIREMENT — `6828155e` TAG — DETERMINATION (`REQUIRES ITS OWN ACT`)

> ## STATUS: **NO TAG CREATED · NO REF MOVED · G24 PROTECTED REF UNTOUCHED · THE REQUIRED DECISION IS NAMED, NOT INFERRED**
> The PA instruction of 2026-10-18 directs the IPD-bound Group 1 items to proceed **and explicitly
> withholds** the `6828155e` tag: *"Create a tag for `6828155e…` only if an explicit valid act
> authorizes it and reconciles the prohibition. Do not infer authorization."* No such act exists.
> This record therefore **does not create a tag**; it states the exact minimum decision that would
> be required, and why the current instruction is not it.

| Field | Value |
|---|---|
| **Record ID** | `IIPS-V3-GROUP1-CV25-G24-TAG-DETERMINATION-2026-10-18-01` |
| **Type** | Determination (records a boundary; renders no authority) |
| **Repository** | `ramkivs/iips-production-market-data` — documentation only |
| **Subject** | A durable reference for `6828155ec6e882bbb4cabcd96b5a841d8c8a6bc4` (the G24 / `AD-03` designated reference) |
| **Companion act** | `IIPS-V3-GROUP1-D3-IPD-PIN-TAG-ACT` — the **`2e11fa3b`** tag, executed 2026-10-18 (`iips-pin-np04-2e11fa3b`, object `8e91cc70…`) |
| **Determination** | **`REQUIRES ITS OWN ACT` — not authorized by the current instruction; ref preserved** |
| **Production status** | NON_PRODUCTION |

---

## 1. Verified state of the protected ref (2026-10-18)

| Item | Verified value |
|---|---|
| Commit | **`6828155ec6e882bbb4cabcd96b5a841d8c8a6bc4`** |
| Reachable from | **exactly one ref**: `refs/heads/arena/01a0f308-iips-production-market-data` |
| Tags at that commit | **none** — `git ls-remote --tags` shows no tag whose peeled target is `6828155e…` |
| Movement this round | **none** — no branch created, moved or deleted; no tag added |
| Relationship to the executed `2e11fa3b` tag | separate lineage; the `2e11fa3b` tag does **not** touch this commit |

---

## 2. The criterion and the prohibition, side by side

| Source | Text (verbatim where quoted) |
|---|---|
| `CV-25` acceptance criterion (IRR master tracker §16.43.2, §16.48.3 row 7) | *"create a lightweight tag on `2e11fa3b` (for example `ipd-pin-2026-10-09-2e11fa3b`) and, while `6828155e` remains the `AD-03` designated reference, **one on `6828155e`**"* |
| G24 prohibition (Gate A derivative-ref record; Gate A execution record; rendered Gate B decision §4) | *"**G24 promotion, merge, cherry-pick, re-pin, or admission** · moving `main` or any other ref"* — and, in the designation records, the lineage is **"not promoted, merged, cherry-picked, re-pinned, or admitted"** |
| Prior IPD analysis (Group 1B proposed acts §4) | *"A tag is a durable reference and thus a durable **re-pin in substance**. No act is proposed here, because any such act would have to **resolve** that prohibition rather than assume around it."* |

**The conflict is real, not formal.** The register asks for a durable reference to `6828155e`; the
binding decision says the G24 lineage must not be re-pinned. A tag on the commit is a durable
reference to it — the exact thing the prohibition names. Neither text is ambiguous, and neither
is stale: both are currently in force.

---

## 3. Why the current instruction does not resolve it

The instruction says, in terms:

> *"Create a tag for `6828155e…` only if an explicit valid act authorizes it and reconciles the
> prohibition. Do not infer authorization or move, tag, or re-pin the protected ref by default."*

That is a **conditional permission addressed to a future act**, not the act itself. It supplies no
disposition on the question the prohibition raises — whether a read-only durable tag on the G24
commit is compatible with "not re-pinned" — and it expressly forbids inferring one.

Making the tag anyway would require this session to decide, on the Authority's behalf, that a
durable tag is not a durable re-pin. **That is precisely the decision reserved to the Authority.**

---

## 4. The minimum explicit decision required

One rendered act, narrowly scoped, containing exactly these elements:

| # | Element | Why it is required |
|---|---|---|
| 1 | **An express reconciliation sentence** stating whether a durable tag on `6828155e` constitutes a "re-pin" for the purposes of the G24 prohibition — and if it does **not**, on what reasoning (for example: a tag is a read-only *reference*, not a branch head, not a package pin, and does not alter the IRR dependency, which continues to pin `2e11fa3b`) | the prohibition names "re-pin"; the act must dispose of that word rather than step around it |
| 2 | **The exact tag name** | prevents an improvised or colliding name |
| 3 | **The exact target** — `6828155ec6e882bbb4cabcd96b5a841d8c8a6bc4` | object identity, not a description |
| 4 | **Annotated or lightweight**, explicitly | the `2e11fa3b` tag is annotated; the register's example text says "lightweight" — the act must choose, not leave it to the session |
| 5 | **A statement that no other clause of §4 moves** — no promotion, no merge, no cherry-pick, no admission, no `main` movement, no IRR re-pin, no change to the `AD-03` designation | the §4 sentence is conjunctive; reconciling one term must not erode the rest |
| 6 | **Explicit preservation** of `refs/heads/arena/01a0f308-…` at `6828155e` (no branch movement, no deletion) | the commit must remain reachable independently of the tag |
| 7 | **Evidence required**: tag object SHA, peeled commit SHA, remote `ls-remote` read-back, fresh-clone resolution, tag count before/after, and confirmation that every other ref is unmoved | the corpus's standard ref-act evidence set |

**Not required, and not proposed:** any reopening of `AD-20`, `REG-11`/`REG-12`, the `D-1` Option C
hosting boundary, or the `CV-25` `2e11fa3b` disposition already executed. The act is additive and
single-object.

---

## 5. What this determination does not do

| Item | State |
|---|---|
| Tag on `6828155e` | **NOT created** — no lightweight, no annotated, no name reserved |
| `6828155e` movement / branch | **untouched**; `arena/01a0f308-…` unchanged |
| IRR re-pin | **none** — IRR continues to pin `2e11fa3b…`; no IRR file read for this purpose beyond the already-recorded pin string |
| `AD-03` designation | unchanged |
| `CV-25` as a whole | **NOT reported complete** — one of its two pin requirements remains outstanding (§4) |
| Any other `CV-*`, gate, promotion or admission | unchanged |

---

## 6. Publication and remote verification

Appended by a **subsequent** commit after publication, so the record is not self-referential.

---

*End of determination `IIPS-V3-GROUP1-CV25-G24-TAG-DETERMINATION-2026-10-18-01` — **G24 REF PRESERVED ·
NO TAG · ONE NARROW ACT REQUIRED · `CV-25` NOT COMPLETE · NON_PRODUCTION**.*
