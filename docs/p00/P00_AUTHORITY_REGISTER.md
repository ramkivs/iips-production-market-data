# P00 — AUTHORITY REGISTER

**Post-D8 authority state of record.**
Source: `docs/d8/D8_AUTHORITY_RECONCILIATION.md`, `docs/d8/D8_STATUS.json`.

> **This register records authority. It grants none, accepts no gate, and certifies nothing.**

---

## 1. The four authority dimensions — must never be conflated

| # | Dimension | State after D8 | Meaning |
|---|---|---|---|
| **A** | **AUTHORITY TO PROCEED** | **GRANTED** | The program may execute work in dependency order. Implementation state = `AUTHORIZED_TO_PROCEED` |
| **B** | **CERTIFICATION AUTHORITY** | **CLEARED (A2) — but NO CERTIFICATION GRANTED** | An owner exists for C1–C12; no certification act has occurred |
| **C** | **FORMAL GATE ACCEPTANCE** | **NONE ACCEPTED — 0 of 18** | A3 clearance makes acceptance *possible*; each gate needs an explicit acceptance act |
| **D** | **PRODUCTION ACTIVATION** | **NOT AUTHORIZED** | A4 is a **separate downstream activation control**, exercised at P16 only |

**Authority to proceed ≠ gate acceptance ≠ certification ≠ production activation.**

---

## 2. ADR decisions

| ADR | Status | Authority | Notes |
|---|---|---|---|
| **ADR-01** (overall) | **APPROVED** | Sai/Ramki | Namespace + collision guard authorized for execution in P05/P06/P11 |
| **ADR-01-A1** namespace token | **APPROVED-BUT-REQUIRES-EXACT-TOKEN-RECORDING** | Sai/Ramki | See §3 — **critical** |
| **ADR-01-A2** collision guard | **APPROVED** | Sai/Ramki | **Fail-closed**, rules C1–C6 as written in `docs/d5/ADR-01_…md` §C.2. Sole certified component affected: `DataBoundExecutor`. No engine/methodology/scoring/calibration/taxonomy change |
| **ADR-02** replay identity extension | **APPROVED** | Sai/Ramki | Additive. `data-${provider}-${dataVersion}-${asOf}` and `SNAP_*` both preserved; explicit `contributingData[]` linkage; inert when empty; existing goldens must stay byte-identical. **Does NOT resolve AD-17** |

---

## 3. ⚠ CRITICAL — OI-10 namespace token

> ## **OI-10 STATUS: APPROVED-BUT-REQUIRES-EXACT-TOKEN-RECORDING**

The Sai/Ramki approval **clears the authority hold** on ADR-01-A1. It does **not** itself state
a token string, and the source artifacts do not establish one:

| Source | Statement |
|---|---|
| `docs/d5/ADR-01_NAMESPACE_COLLISION_GUARD.md:89` | "Namespace token — **RECOMMENDED — NOT APPROVED**" |
| `docs/d5/ADR-01_NAMESPACE_COLLISION_GUARD.md:98` | "This token is **RECOMMENDED ONLY. It is NOT approved.**" |
| `docs/d5/ADR-01_NAMESPACE_COLLISION_GUARD.md:99` | "An alternative token that satisfies the same disjointness property is equally acceptable … only the *partition property* is load-bearing." |
| `docs/d5/ADR-01_NAMESPACE_COLLISION_GUARD.md:203` | "Namespace token `MD:<domain>.<field>` **NOT approved** (OI-10 remains open)." |
| `docs/d4/D4_07_FIELD_NAMESPACE.md` §I.3 | "The final token requires sign-off with the ADR. **Not assumed approved.**" |

**`MD:<domain>.<field>` remains an illustrative recommendation and is NOT a final approved
token.** It must not be silently converted. Recording the exact token is a **documentation /
recording action against the approval — not permission to invent one.**

**Blocks:** the field-key portions of P05 Acquisition, P06 Normalization, P11 Engine Integration.
**Does not block:** P00.

---

## 4. Authority roles

| Role | State | Person named? | Scope and limits |
|---|---|---|---|
| **A1** Security / Identity | **PROGRAM-AUTHORITY CLEARANCE ESTABLISHED** | **NO** | Cleared for program execution. **OI-08 and OI-09 remain open content decisions** — clearance does not answer them |
| **A2** Certification | **PROGRAM-AUTHORITY CLEARANCE ESTABLISHED** | **NO** | Cleared for program execution. **CERTIFICATION = `NONE_GRANTED`.** C1–C12 remain future acts requiring their own evidence |
| **A3** Gate acceptance | **PROGRAM-AUTHORITY CLEARANCE ESTABLISHED** | **NO** | Cleared for the **gate process**. **NO AUTOMATIC GATE ACCEPTANCE.** 0 of 18 accepted; each requires an explicit act |
| **A4** Production activation | **SEPARATE DOWNSTREAM ACTIVATION CONTROL** | **NO** | Exercised at **P16 only**, which is downstream of the blocked P15. **Not authorized by D8** |

**No individual names are recorded. None may be inferred** from commit messages, repository
ownership, code authorship or document authorship.

---

## 5. Program state

| Field | Value |
|---|---|
| `program_status` | **`AUTHORIZED_TO_PROCEED`** |
| `implementation_status` | **`AUTHORIZED_TO_PROCEED`** — currently executable: **P00 only** |
| `certification_status` | **`NONE_GRANTED`** |
| `formal_gate_status` | **`NONE_ACCEPTED`** (0 of 18) |
| `production_activation_status` | **`NOT_AUTHORIZED`** |

---

## 6. Preserved unresolved / open items

| Item | State | Owner |
|---|---|---|
| **AD-17 / M-2** ReplayService literal returns | **UNRESOLVED** — not resolved by ADR-02 approval | Existing-IIPS |
| **M-1 / AD-4** | **OPEN_REVALIDATION_REQUIRED** — not fixed, not certified, not revoked | Existing-IIPS (AD-10) |
| **E2E-030** | **NOT REVOKED · NOT RENEWED** — AD-4 requires revalidation | Existing-IIPS |
| **M-5** authentication/session | **OPEN** | Existing-IIPS |
| **M-6** retention | **OPEN** | Existing-IIPS |
| **OI-08** cardinality 1→N | **OPEN** — owner cleared (A1), decision not made | New program |
| **OI-09** identifier standard | **OPEN** — owner cleared (A1), decision not made | New program |
| **OI-10** exact token | **APPROVED-BUT-REQUIRES-EXACT-TOKEN-RECORDING** | Sai/Ramki |

Detail: `P00_OPEN_ITEMS_REGISTER.md`.

---

## 7. Standing rule

> **Certification must never be inferred from authority approval.**
> Approval to proceed authorizes *work*. Certification requires *evidence* and a certification
> act. Gate acceptance requires an *explicit acceptance act*. Production activation requires
> the A4 control at P16.
