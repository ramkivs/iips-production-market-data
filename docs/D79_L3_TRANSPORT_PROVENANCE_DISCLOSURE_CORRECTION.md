# D79 — L-3 TRANSPORT PROVENANCE/DISCLOSURE CORRECTION

**Act ID:** `D79-IMPLEMENT-AUTHORIZED-L3-DISCLOSURE-PROVENANCE-CORRECTION`
**Authority:** **D78 — decision A**, bounded L-3 disclosure/provenance correction, explicitly
covering **both** transport locations.
**Type:** Additive accuracy correction to two string values. Not acceptance, not certification,
not production activation, **not replay remediation**.
**Branch:** `arena/01a0814b-…` · **Base:** `a7018ef…` (D77), tree clean.

---

## 1. THE DEFECT

`computeCertifiedReplay()` (L398) and `computeCertifiedEvidence()` (L443) hardcode
`reproduced: true` / `byteIdentical: true` and **never invoke** the `ReplayService` instance
constructed at L204. Their `provenance.dataSource` nevertheless attributed those constants to a
**runtime** platform execution.

This was **user-visible**, not internal: `dataSource` renders at `ReplayExplorer.tsx`:70 and :138
(`data-testid="replay-provenance"`) and `EvidenceExplorer.tsx`:51 and :92.

It was also the **last contradiction in the chain** — D66 corrected the UI disclosures and D71 the
P12/P13 serialized disclosures to say the values are hardcoded by `executive-transport`, while the
transport itself still claimed the opposite.

---

## 2. EXACT BEFORE → AFTER

### Site 1 — `executive-transport.ts`:434 → `computeCertifiedReplay()`

**BEFORE**
```
dataSource: 'certified v2.0 platform (ReplayService ReplayResult) over frozen v1.1 Replay Baseline inputs',
```
**AFTER**
```
dataSource: 'transport fixture constants over frozen v1.1 Replay Baseline inputs — reproduced/byteIdentical are hardcoded by executive-transport, NOT produced by a runtime ReplayService verification',
```

### Site 2 — `executive-transport.ts`:492 → `computeCertifiedEvidence()`

**BEFORE**
```
dataSource: 'certified v2.0 platform (EvidencePipeline + Snapshot + Replay) over frozen v1.1 Replay Baseline inputs',
```
**AFTER**
```
dataSource: 'transport fixture constants over frozen v1.1 Replay Baseline inputs — reproduced/byteIdentical are hardcoded by executive-transport, NOT produced by a runtime replay or EvidencePipeline verification',
```

Each site also carries an explanatory comment recording the prior wording and why it was false.
**No verification is claimed by either string** — both state the *absence* of runtime verification.

---

## 3. FILES CHANGED (3) — ALL AUTHORIZED

| File | Change | Classification |
|---|---|---|
| `frontend/server/executive-transport.ts` | **+11 / −2** — two `dataSource` strings + comments | **AUTHORIZED** (D78 A, both sites) |
| `frontend/server/executive-transport-l3-provenance.test.ts` | **NEW** — 9 additive guards | **AUTHORIZED** (D79 regression guards) |
| `docs/D79_…md` | this record | **AUTHORIZED** |

**UNEXPECTED changes: NONE.** The complete source diff is the two string lines plus comment lines —
verified line by line.

---

## 4. PRESERVATION — VERIFIED

| Item | Status |
|---|---|
| `reproduced: true` (L425, L492) | **UNCHANGED** — still hardcoded `true` |
| `byteIdentical: true` (L426, L493) | **UNCHANGED** — still hardcoded `true` |
| **`ReplayService` binding** | **STILL UNBOUND** — zero `.replay()` invocations in the file |
| DTO fields / shape · route shape | **UNCHANGED** |
| Replay computation · EvidencePipeline behaviour | **UNCHANGED** |
| `RuntimeCoordinator` · `iips-platform` | **0 changes** |
| `p12/src`, `p13/src`, P05–P11, P14 | **0 changes** |
| `frontend/src` (all UI) | **0 changes** |
| Historical D-records | **0 changes** |
| Certification semantics | **UNCHANGED** |

**Only the two displayed `dataSource` strings changed in the API payloads.** No boolean, no field,
no route, no behaviour.

---

## 5. REGRESSION GUARDS + MUTATION PROOF

**9 additive tests**, none existing modified or removed. They assert the corrected wording, the
absence of each stale attribution, that no "verified replay/reproduction/byte" phrasing appears,
and — deliberately — that **the booleans remain hardcoded `true`** (D79 corrected the description,
not the values).

**Mutation proof, performed per site:**

| Mutation | Result |
|---|---|
| Restore stale **ReplayService ReplayResult** string only | **3 failed / 6 passed** — only the replay guards fired |
| Restore stale **EvidencePipeline + Snapshot + Replay** string only | **3 failed / 6 passed** — only the evidence guards fired |
| Authorized wording restored | **9 / 9 passed** |

Each guard detects its own site independently — they are not vacuous, and neither masks the other.

---

## 6. TEST RESULTS — FRESHLY OBSERVED

| Suite | Floor | **Observed** |
|---|---|---|
| **Frontend full** | ≥752 / 0 | **761 passed / 0 failed**, 32 skipped (57 files) |
| **P12 full** | ≥154 / 0 | **154 pass / 0 fail** |
| **P13 full** | ≥86 / 0 | **86 pass / 0 fail** |
| App `tsc --noEmit` | clean | **clean, exit 0** |
| Server `tsc --noEmit -p tsconfig.server.json` | clean | **clean, exit 0** |
| `ReplayExplorer` + `EvidenceExplorer` UI tests | — | **21 / 21** |
| L-3 guards | — | **9 / 9** |

Frontend **752 → 761** (+9, all new).

---

## 7. PAYLOAD / RENDER VERIFICATION

Executed against the real exported functions:

```
REPLAY   dataSource: transport fixture constants over frozen v1.1 Replay Baseline inputs —
                     reproduced/byteIdentical are hardcoded by executive-transport,
                     NOT produced by a runtime ReplayService verification
EVIDENCE dataSource: transport fixture constants over frozen v1.1 Replay Baseline inputs —
                     reproduced/byteIdentical are hardcoded by executive-transport,
                     NOT produced by a runtime replay or EvidencePipeline verification
replay booleans:     {"snapshotId":"snap_Banking","reproduced":true,"byteIdentical":true,
                      "evidenceRefs":["ev_Banking"]}
```

Serialized payloads contain **no** stale attribution. Because the UI renders `dataSource` verbatim,
the rendered provenance on UI17 and UI16 now carries the corrected text; **the 21 UI tests pass
unchanged**, confirming no behavioural change.

---

## 8. RESIDUAL STATUS

| Item | Status |
|---|---|
| **L-3** | **CLOSED as to the disclosure/provenance defect ONLY** |
| **Underlying replay hardcoding** | **RECORDED UNRESOLVED LIMITATION** — `computeCertifiedReplay()` still returns constants and remains unbound from `ReplayService`. Binding it is a separate, larger authority question, **not performed**. |
| **R-3** | CLOSED (D75) · **L-2** CLOSED (D77) |
| **R-6** | **3 CLOSED / 1 OPEN** (`provenanceFromSnapshot`, pending R-2) |
| **R-2** provider ingestion | **OPEN** — externally blocked (licensing/credentials, OI-P04-04) |
| **R-4** UI binding | **OPEN** |
| **R-5** C12 | **BLOCKED** — M-5, security authority unknown |
| **R-7** browser/runtime evidence | **OPEN** — Windows-only; Arena cannot perform it |
| **P11 dormant residue** | **OPEN-DORMANT** |
| **AD-17 / M-2** | **UNRESOLVED** (gate P15) |
| **P15** | **ACCEPTED — certification NONE** |
| **P16** | **CERTIFIED / CLOSED** |
| **Production authorization** | **NOT GRANTED** |
| Next free D-number | **D80** |

**No stale replay attribution now remains anywhere in executable source, serialized payloads, or
rendered UI.**
