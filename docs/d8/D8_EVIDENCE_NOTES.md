# D8 — EVIDENCE NOTES

Evidence basis for the D8 reconciliation. **Read-only review; no artifact was modified.**

---

## EN-01 — Authority evidence of record

| Field | Value |
|---|---|
| Evidence | User statement: *"consider this as decision approved by Sai/Ramki to move forward"* |
| Location | Conversation turn immediately preceding D8 |
| Interpreted as | Sai/Ramki approval to proceed with the pending authority decisions and execution sequence |
| Applies to | ADR-01 (A1, A2), ADR-02, A1, A2, A3, A4, OI-10 authority hold |
| Does **not** apply to | AD-17 (never placed before Sai/Ramki; explicitly firewalled in D5 §F and D7), M-1 / AD-4 (existing-IIPS, AD-10), M-5, M-6 |
| Nature | **The first and only authority change since D5.** D6 and D7 recorded no authority evidence |

---

## EN-02 — Artifacts reviewed (15, all read-only)

| Artifact | Reviewed for |
|---|---|
| `docs/d4/D4_12_PHASE_SEQUENCE.md` | Phase dependency order; P00 `Depends on: —` |
| `docs/d4/D4_14_AUTHORITY_ADR_REGISTER.md` | 14 G-A decisions; open register |
| `docs/d4/D4_15_ACCEPTANCE_READINESS.md` | A–R coverage; conformance |
| `docs/d5/ADR-01_NAMESPACE_COLLISION_GUARD.md` | Token status; rules C1–C6; affected component |
| `docs/d5/ADR-02_REPLAY_IDENTITY_EXTENSION.md` | Additive delta; AD-17 firewall |
| `docs/d5/E-01_SECURITY_IDENTITY_AUTHORITY.md` | A1 scope; OI-08/OI-09 ownership |
| `docs/d5/E-02_GATE_ACCEPTOR_AUTHORITY.md` | A3 scope; 0-of-18 finding |
| `docs/d5/D5_DEPENDENCY_MAP.md` | Overlay structure |
| `docs/d5/D5_REGISTER.md` | Status-type taxonomy |
| `docs/d7/D7_AUTHORITY_DECISION_SHEET.md` | Decision framing |
| `docs/d7/D7_AUTHORITY_ROLE_ASSIGNMENT.md` | A1–A4 pre-state |
| `docs/d7/D7_BLOCKER_MATRIX.md` | 13 blockers; resolution semantics |
| `docs/d7/D7_STATUS.json` | Prior machine state |
| `docs/d7/D7_EXTERNAL_HANDOFF.md` | Handoff structure |
| `docs/d7/D7_EVIDENCE_NOTES.md` | CD-01 citation drift |

---

## EN-03 — Namespace token: why it is NOT recorded as `MD:<domain>.<field>`

Instruction B required that the exact approved token be preserved from existing material and
**not** substituted unless the material explicitly establishes it as final. Direct verification:

| Source | Line | Text |
|---|---|---|
| `docs/d5/ADR-01_…md` | 89 | "### C.1 Namespace token — **RECOMMENDED — NOT APPROVED**" |
| `docs/d5/ADR-01_…md` | 98 | "This token is **RECOMMENDED ONLY. It is NOT approved.**" |
| `docs/d5/ADR-01_…md` | 99 | "An alternative token that satisfies the same disjointness property is equally acceptable … only the *partition property* is load-bearing." |
| `docs/d5/ADR-01_…md` | 203 | "Namespace token `MD:<domain>.<field>` **NOT approved** (OI-10 remains open)." |
| `docs/d4/D4_07_FIELD_NAMESPACE.md` | I.3 | "The final token requires sign-off with the ADR. **Not assumed approved.**" |

**Conclusion:** no artifact establishes a final token. The approval of record clears the
*authority hold* but does not itself state a token string.

**Recorded status: `APPROVED-BUT-REQUIRES-EXACT-TOKEN RECORDING`.**

`MD:<domain>.<field>` remains the standing recommendation and is the expected value — recording
it is a factual act to be performed against the approval, not an inference this run may make.
Blocks the field-key portions of P05, P06, P11. Does **not** block P00.

---

## EN-04 — AD-17 firewall preserved

`docs/d5/ADR-02_…md` §F states the two must not be merged into one approval; `docs/d7/` repeats
it in four deliverables. AD-17 was never placed before Sai/Ramki. No independent authority
evidence exists.

**AD-17 = UNRESOLVED.** Not resolved by implication from ADR-02 approval.

---

## EN-05 — M-1 / AD-4 preserved

No repair evidence, no revalidation evidence. Owner remains the existing-IIPS program (AD-10).

**Recorded as: OPEN — revalidation required. NOT fixed · NOT certified · NOT revoked.**
**E2E-030: not revoked, not renewed.** P15 remains blocked.

---

## EN-06 — A3 / A4: clearance without person-assignment

Instruction D forbids inventing individual names. The approval establishes that the program may
proceed; it does not identify individuals.

**Recorded as `PROGRAM_AUTHORITY_CLEARANCE_ESTABLISHED` with `person_named: false`.**
Gate acceptance is now *possible*; **0 of 18 gates are accepted**, and each requires an explicit
acceptance act. Production activation remains unauthorized and downstream of the blocked P15.

---

## EN-07 — CD-01 citation drift (carried forward, still open)

From `docs/d7/D7_EVIDENCE_NOTES.md`: D4/D5 cite `LiveDataRuntime.ts:76`; the current clone shows
the same statement at `:78`. Same repository, same commit `5decdca`, same unguarded merge, same
behaviour. **Line-number citation only — no authority, methodology, contract or disposition
impact.**

**Still deferred** — D8 does not modify D4/D5. P00's evidence-conventions artifact should
mandate commit-pinned citations (`path:line @ commit`) so this class of drift is self-evident,
and a later cleanup run can correct the three affected citations.

---

## EN-08 — What D8 deliberately did not do

| Action | Why not |
|---|---|
| Invent a namespace token | Instruction 7; EN-03 |
| Resolve AD-17 | Instruction 3; EN-04 |
| Mark M-1 fixed/certified/revoked | Instruction 4; EN-05 |
| Name individuals for A3/A4 | Instruction D; EN-06 |
| Grant certification | Instruction G — `certification_status: NONE_GRANTED` |
| Accept any gate | `formal_gate_status: NONE_ACCEPTED` |
| Reorder the roadmap | Instruction 10 — D4 sequence used verbatim |
| Modify tracker / SPEC / existing-IIPS / D4 / D5 / D7 | Instructions 8, G |
| Execute P00 | Instruction 9 — authorization only |
| Re-scan unchanged evidence | D7 closing guidance |

---

## EN-09 — D7 → D8 state changes (complete delta)

| Item | D7 | D8 | Changed? |
|---|---|---|---|
| program_status | `AUTHORITY_REVIEW_HOLD` | **`AUTHORIZED_TO_PROCEED`** | **YES** |
| implementation_status | `NOT_AUTHORIZED` | **`AUTHORIZED_TO_PROCEED`** (P00 executable now) | **YES** |
| ADR-01 | `PENDING_RAMKI_SAI` | **`APPROVED`** | **YES** |
| ADR-01-A1 token | `PENDING`, not approved | **`APPROVED_BUT_REQUIRES_EXACT_TOKEN_RECORDING`** | **YES (partial)** |
| ADR-01-A2 guard | `PENDING` | **`APPROVED` fail-closed** | **YES** |
| ADR-02 | `PENDING_RAMKI_SAI` | **`APPROVED`** additive | **YES** |
| OI-10 | `PENDING` | **Authority cleared; token not recorded** | **YES (partial)** |
| A1 / A2 / A3 / A4 | `UNKNOWN` ×4 | **`PROGRAM_AUTHORITY_CLEARANCE_ESTABLISHED`** ×4, no persons named | **YES** |
| OI-08 / OI-09 | Unresolved, owner unknown | **Owner cleared; decisions OPEN** | **Partial** |
| AD-17 | `UNRESOLVED` | `UNRESOLVED` | **NO** |
| M-1 / AD-4 | `OPEN_REVALIDATION_REQUIRED` | `OPEN_REVALIDATION_REQUIRED` | **NO** |
| M-5 / M-6 | `OPEN` | `OPEN` | **NO** |
| certification_status | `NONE_GRANTED` | `NONE_GRANTED` | **NO** |
| formal_gate_status | `NONE_ACCEPTED` | `NONE_ACCEPTED` (0 of 18) | **NO** |
| production_activation | `NOT_AUTHORIZED` | `NOT_AUTHORIZED` | **NO** |

**8 items changed · 8 items deliberately unchanged.**

---

## EN-10 — Documentation-only gaps (not defects)

| Gap | Nature | Action |
|---|---|---|
| **Exact namespace token unrecorded** | Documentation/recording action, **not permission to invent a token** | Record against the Sai/Ramki approval; unblocks P05/P06/P11 field-key work |
| **CD-01 line-number drift** (`:76` vs `:78`) | Citation offset only | Deferred; P00 evidence conventions to mandate `path:line @ commit` |
| **P10 thin D4 coverage** | Specification depth gap | Deepen before P10 execution |
| **Missing IES-016/017/020 certificate files** | Artifact-location gap; **AD-8 stands — engines ARE certified** | Existing-IIPS |

---

## EN-11 — Integrity checks performed in D8

| Check | Method | Result |
|---|---|---|
| Tracker unchanged | `md5sum` = `f0bd7b97…` | **PASS** |
| SPEC unchanged | `md5sum` = `7b7ea4f1…` | **PASS** |
| D4 unchanged | `md5sum` on `D4_12_PHASE_SEQUENCE.md` = `dddb4bfe…` | **PASS** |
| D5 unchanged | `md5sum` on `ADR-01_…md` = `0c8a3c46…` | **PASS** |
| D7 unchanged | `md5sum` on `D7_STATUS.json` = `4279e049…` | **PASS** |
| Existing-IIPS untouched | Not written to in D8 | **PASS** |
| No commits / pushes | `git log` = `eae2ff6` only; `git status` = `?? docs/` | **PASS** |
| Only D8 artifacts created/updated | Writes confined to `docs/d8/` | **PASS** |
| No production implementation | No source/test file created | **PASS** |
| No certification granted | `certification_status: NONE_GRANTED` | **PASS** |
| No roadmap reorder | D4 sequence used verbatim | **PASS** |

**No evidence is claimed in this package that was not actually inspected.**
