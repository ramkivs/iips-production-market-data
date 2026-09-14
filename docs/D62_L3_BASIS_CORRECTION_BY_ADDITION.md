# D62 — L-3 FACTUAL BASIS: CORRECTION BY ADDITION

**Act ID:** `D62-L3-BASIS-CORRECTION-BY-ADDITION-AUTHORITY-ACT-01`
**Role:** Program Authority
**Type:** CORRECTION BY ADDITION — authority record only.
No implementation, no remediation, no acceptance, no certification, no production authorization.
**Branch:** `arena/01a0814b-iips-production-market-data`
**Parent:** `9f20a7589765e8b62ff43e3ecee80ce153a58ee3` (D61)

> **This act corrects the stated BASIS of L-3. It does NOT close L-3.**
> **AD-17 / M-2 REMAIN UNRESOLVED.**

---

## 1. THE OLD L-3 BASIS (verbatim, preserved)

`docs/D55_P13B_A3_ACCEPTANCE.md` §5, lines 122-126:

> ### L-3 — AD-17 / M-2 remains UNRESOLVED
>
> P13-B **removed a prohibited UI claim**. It performed **no verification** of replay, and it
> **did not remediate** AD-17 or M-2. `ReplayService` still returns `reproduced` /
> `byteIdentical` as **literals**. Resolution gate remains external (P15 / Existing-IIPS authority).

The same characterisation was carried forward, verbatim or in paraphrase, into:

| Artifact | Location |
|---|---|
| `docs/D55_P13B_A3_ACCEPTANCE.md` | §5 L-3 |
| `docs/D57_AD17_L5_BROADER_SURFACE_AUTHORITY_ADJUDICATION.md` | §2 R-1 |
| `docs/D58_AD17_L5_BROADER_AMENDMENT_IMPLEMENTATION.md` | §7 |
| `docs/D61_L6_REPLAYSTATE_AD17_AMENDMENT_IMPLEMENTATION.md` | §7 |
| `frontend/src/components/evidence/Ad17Disclosure.tsx` | L8-9 |
| `frontend/server/p12-transport.ts` | L433 |

**None of the above is edited by this act.** See §6.

---

## 2. THE CORRECTED BASIS

### 2.1 The platform `ReplayService` COMPUTES — it does not return literals

`iips-platform/src/replay/ReplayService.ts` L4-6:

> ```
>  * M-2 REPAIR (D41 Workstream C):
>  *   Replay now INDEPENDENTLY RECOMPUTES the engine result from the stored snapshot's
>  *   execution context. `reproduced` and `byteIdentical` are COMPUTED, not literal.
> ```

L138-140:

```ts
const scoresMatch  = hashObject(recomputed.scores) === hashObject(snapshot.scores);
const verdictMatch = recomputed.verdict === snapshot.verdict;
const byteIdentical = metricsMatch && scoresMatch && verdictMatch;
```

**Therefore the statement "`ReplayService` still returns `reproduced`/`byteIdentical` as
literals" is FACTUALLY STALE.** The M-2 repair predates this session's acts
(introduced at or before `1dc7c53`).

### 2.2 The UI-facing values do NOT come from that service

`frontend/server/executive-transport.ts` L397 `computeCertifiedReplay(sectorId)` constructs
the replay DTO served to every UI surface. At **L425-426** and again at **L487-488** it
emits:

```ts
replay: {
  snapshotId: `snap_${d.sector}`,
  reproduced: true,        // hardcoded
  byteIdentical: true,     // hardcoded
  evidenceRefs: [`ev_${d.sector}`],
},
```

A `ReplayService` instance **is** constructed in the same module at **L204**
(`const replay = new ReplayService(store);`) and handed to the `RuntimeCoordinator` at L205 —
but **`computeCertifiedReplay` never calls it.** Direct search for a replay-result call on
that instance returns **0 occurrences**.

**The values reaching the UI are literals hardcoded in the transport — not un-repaired
service output.**

### 2.3 The corrected statement of L-3

> **L-3 (corrected basis).** AD-17 / M-2 remain UNRESOLVED. The platform `ReplayService`
> **does** compute `reproduced` / `byteIdentical` (M-2 repair, D41 Workstream C). However
> `frontend/server/executive-transport.ts::computeCertifiedReplay()` **hardcodes**
> `reproduced: true` and `byteIdentical: true` (L425-426, L487-488) and **never invokes the
> repaired service**. The current AD-17 / M-2 data-integrity issue is therefore
> **transport-side hardcoding**, not platform-side literal return.

---

## 3. THE DISTINCTION, STATED PLAINLY

| Layer | Artifact | Behaviour | AD-17 significance |
|---|---|---|---|
| **Platform** | `iips-platform/src/replay/ReplayService.ts`:140 | `byteIdentical` **COMPUTED** by recomputation + comparison | M-2 repair **present in source**. **NOT evidence of runtime verification.** |
| **Transport** | `frontend/server/executive-transport.ts`:425-426, 487-488 | `reproduced: true`, `byteIdentical: true` **HARDCODED** | **This is the live integrity issue.** Every UI value derives from here. |
| **Presentation** | UI surfaces | Values shown as **NOT VERIFIED** with AD-17 disclosure (D56, D58, D61) | Presentation is now AD-17-safe. **The underlying data is still hardcoded.** |

**Consequence of substance:** remediating AD-17 / M-2 for this program is now understood to
require **binding the transport to the repaired service**, not repairing the platform. That
changes the *shape* of the future remediation. **It does not authorize it, scope it, or
assign it here.**

---

## 4. WHAT REMAINS TRUE AND UNCHANGED

- **Code presence is NOT runtime verification.** The existence of a repaired
  `ReplayService` in the repository establishes **nothing** about what any runtime executes.
  Arena establishes (A) presence in the repository and (B) presence on the branch **only**.
- **No replay verification has been established** by this act or any prior act in this chain.
- **R-7 remains OPEN independently** — no browser or runtime evidence exists, and none is
  produced here.
- The UI presentation corrections (D56 / D58 / D61) removed prohibited **claims**. They did
  not, and do not, make the underlying values verified.

---

## 5. STATUS — NOTHING CLOSED BY THIS ACT

| Item | Status |
|---|---|
| **L-3** | **OPEN** — basis corrected, limitation **NOT closed** |
| **AD-17 / M-2** | **UNRESOLVED** |
| **L-2** | **OPEN** — unchanged |
| **L-4** | **OPEN** — unchanged |
| **R-2** (provider ingestion not wired) | OPEN — unchanged |
| **R-3** (`/api/screener/saved` persist-free) | OPEN — unchanged |
| **R-4** (UI07/08/09/10 unbound; UI10 deferred) | OPEN — unchanged |
| **R-5** (C12 BLOCKED on M-5) | OPEN — unchanged |
| **R-6** (4 of 32 P12 exports N/A) | OPEN — unchanged |
| **R-7** (no browser/runtime evidence) | **OPEN — independently** |
| L-1 | CLOSED (D56) |
| L-5 | CLOSED for all live sites (D58) |
| L-6 | CLOSED (D61) |
| P13 certification | **NONE** |
| Production authorization | **NOT GRANTED** |
| Accepted gates | **NONE reopened** |

---

## 6. PRESERVATION AND PRECEDENCE

D55, D56, D57, D58, D59, D60 and D61 are **immutable** and were **not edited**. Their stale
wording is **deliberately left intact** under **O-3** (do not alter historical quotations)
and the standing correct-by-addition rule.

The stale characterisation also appears in two **source** artifacts —
`frontend/src/components/evidence/Ad17Disclosure.tsx`:8-9 and
`frontend/server/p12-transport.ts`:433. **Neither is modified by this act**, which is
authority-only and grants no source scope. This is recorded as a known documentation defect:

> **L-7 (NEW, OPEN)** — the stale "`ReplayService` returns literals" characterisation is
> embedded in two source comments, one of which (`Ad17Disclosure.tsx`) is the approved AD-17
> treatment reused across every amended surface. Correcting them requires a **separate
> authority act** granting source scope. **No live AD-17 claim arises from this** — the
> comments understate rather than overstate the program's position, and the rendered
> disclosure text is unaffected.

**D62 is the binding correction-by-addition for the L-3 basis.** Where D62 §2.3 conflicts
with the L-3 wording in any earlier record, **D62 governs**.

---

## 7. WHAT THIS ACT DOES NOT DO

- Does **not** close L-3, resolve AD-17, or resolve M-2.
- Does **not** modify `ReplayService.ts` or `executive-transport.ts`.
- Does **not** perform, authorize, or scope transport remediation.
- Does **not** claim runtime or browser verification.
- Does **not** reopen any accepted gate, or alter any acceptance or certification status.
- Does **not** edit D55–D61, or alter L-2, L-4 or R-2…R-7.
- Does **not** grant certification or production authorization.
- Not pushed.

**Next free D-number: D63.**
