# D7 — AUTHORITY DECISION SHEET

**Handoff preparation only. PREPARED — NOT TRANSMITTED.**
No decision below is made, approved, rejected or inferred by this document.

Program state: **AUTHORITY-REVIEW HOLD** (D6 — no authority change).

---

## DECISION GROUP A — RAMKI / SAI

---

### ADR-01-A1 — Namespace token

**Question**
What exact namespace token is approved for market-data fields entering
`ExecutionRequest.inputs`?

**Current recommendation**
`MD:<domain>.<field>` — e.g. `MD:price.last`, `MD:valuation.peRatio`

**Status**
**RECOMMENDED — NOT APPROVED**

**Authority**
Ramki / Sai

**Required decision**
`APPROVE` / `REJECT` / `MODIFY` / `DEFER`

**Reference:** `docs/d5/ADR-01_NAMESPACE_COLLISION_GUARD.md` §A-1, §C.1 · open item **OI-10**

---

### ADR-01-A2 — Collision guard

**Question**
Is fail-closed pre-merge collision detection in `DataBoundExecutor` approved?

**Status**
**PENDING**

**Authority**
Ramki / Sai

**Required decision**
`APPROVE` / `REJECT` / `MODIFY` / `DEFER`

**Reference:** `docs/d5/ADR-01_NAMESPACE_COLLISION_GUARD.md` §A-2, rules C1–C6

---

### ADR-02 — Replay identity extension

**Question**
May `dataVersion` + `asOf` + provider participate in effective replay identity, with explicit
`data-*` ↔ `SNAP_*` linkage?

**Status**
**PENDING**

**Authority**
Ramki / Sai

**Required decision**
`APPROVE` / `REJECT` / `MODIFY` / `DEFER`

**Reference:** `docs/d5/ADR-02_REPLAY_IDENTITY_EXTENSION.md`

---

## AD-17 — SEPARATE DECISION

**Question**
How should the existing `ReplayService` literal-return behaviour
(`reproduced: true` / `byteIdentical: true`) be treated?

**Status**
**UNRESOLVED**

**Authority**
**Existing-IIPS authority** (not Ramki/Sai in the ADR-01/ADR-02 sense; not this program)

**Required decision**
Owned and framed by the existing-IIPS program. This program does not propose an option set.

### ⚠ IMPORTANT

> **This is NOT ADR-02.**
> **ADR-02 approval MUST NOT be interpreted as AD-17 approval.**

ADR-02 concerns an *additive* market-data identity extension introduced by this program.
AD-17 / M-2 concerns a *pre-existing* implementation defect in `ReplayService`, independent of
this program. They must be decided separately and must not be bundled into a single approval.

---

## Decision recording note

Any decision on the above becomes authoritative only when explicit decision evidence exists in
the workspace. Mentions of Ramki/Sai in commit messages, document authorship, repository
ownership or code authorship are **not** decision evidence.
