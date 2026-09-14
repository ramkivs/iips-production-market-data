# D55 — P13-B A3 GATE ACCEPTANCE

**Artifact ID:** D55
**Title:** P13-B Product-UI Integration — A3 Gate Acceptance
**Act type:** GATE ACCEPTANCE (not certification, not production authorization)
**A3 acceptor:** **Sai** — designated by D53
**Implementation authorization:** D54 (`dce5cdb4`)
**Implementation baseline accepted:** `9e4c2e1880e6608905f9b02a5fcf794a68ee818d`
**Date:** 2026-09-14
**Status:** ACTIVE

---

## 1. DECISION

**A — ACCEPT P13-B AT A3.**

The P13-B Product-UI Integration implementation is **ACCEPTED** at the A3 gate,
**limited strictly to the scope authorized by D54**.

Work items **P13-B-01 through P13-B-09** are **ACCEPTED**.

---

## 2. AUTHORITY CHAIN

| Element | Value | Record |
|---|---|---|
| A3 acceptor | **Sai** | `docs/D53_P13B_A3_ACCEPTOR_DESIGNATION.md` |
| Designation scope | P13-B gate acceptance **ONLY** | D53 |
| Implementation authorization | GRANTED | `docs/D54_P13B_IMPLEMENTATION_AUTHORIZATION.md` |
| UI17 amendment authorization | GRANTED (bounded) | `P13-B-R1-UI17-AD17-AUTHORITY-ADJUDICATION-01`, Decision A |
| Implementation baseline | `9e4c2e1880e6608905f9b02a5fcf794a68ee818d` | remote-verified |
| Evidence package | `docs/P13B_IMPLEMENTATION_EVIDENCE.md` | 498 lines, 14 sections |

**A2/A3 separation note (D53 §3) remains in force and is NOT modified by this act.** Sai also
holds A2 authority (`2d28e42`) and certified the C6/C7 contracts that P13-B consumes. The
concern was raised before designation; the Program Authority designated notwithstanding. The
roles remain **distinct acts, not merged by common identity**.

---

## 3. ACCEPTED WORK ITEMS

| Item | Scope | Status |
|---|---|---|
| P13-B-01 | P12 transport adapter; additive endpoints only | ✅ ACCEPTED |
| P13-B-02 | Server-side tenant/security enforcement (fail-closed) | ✅ ACCEPTED |
| P13-B-03 | Derived provenance DTO pipeline | ✅ ACCEPTED |
| P13-B-04 | Quality / degradation propagation (worst-case) | ✅ ACCEPTED |
| P13-B-05 | Screener → C6 (UI05) | ✅ ACCEPTED |
| P13-B-06 | Search / object resolution → C7 (UI13, UI14) | ✅ ACCEPTED |
| P13-B-07 | Evidence / replay linkage + AD-17 guard (UI17) | ✅ ACCEPTED |
| P13-B-08 | Dual-transport lineage disclosure | ✅ ACCEPTED |
| P13-B-09 | Derived as-of display | ✅ ACCEPTED |

**9 / 9 ACCEPTED.**

---

## 4. INDEPENDENT VERIFICATION

The material implementation claims were **independently reproduced from a fresh clone** of the
authoritative branch — not read from the evidence report and not taken from a working tree.

| Claim | Reported | Independently verified |
|---|---|---|
| Frontend suite | 732 pass / 0 fail / 32 skipped | ✅ **732 / 0 / 32** |
| P12 contract suite | 153 pass / 0 fail | ✅ **153 / 0** |
| TypeScript (app) | clean | ✅ clean (exit 0) |
| TypeScript (server) | clean | ✅ clean (exit 0) |
| Existing v2.0 routes | 13, unchanged | ✅ **13** |
| UI17 prohibited claim removed | removed | ✅ **absent from the component body** |
| UI17 guard tests | 11/11 | ✅ 11 pass |

### Boundary audit — cumulative `dce5cdb4 → 9e4c2e18` (19 files, +3378 / −20)

| Area | Changed |
|---|---|
| `p05` … `p14` (all) | **0** |
| `p12` (certified C6/C7 source) | **0** |
| `p13` (incl. `boundedSurfaces.js` / BS-1) | **0** |
| `iips-platform` | **0** |
| `program-v1.1-certification` | **0** |
| `docs/d4`, `docs/p00` | **0** |
| `docs/PHASE_*` (accepted records) | **0** |
| `docs/D*.md` (authority records) | **0** |

The only `docs/` addition across the whole of P13-B is the evidence report itself.

---

## 5. CARRIED LIMITATIONS — RECORDED AS A CONDITION OF ACCEPTANCE

These limitations are **accepted as carried**. They are **not** resolved by this acceptance and
**must not** be represented as resolved.

### L-1 — Shared `ReplaySummary` retains the AD-17-unsafe presentation

`frontend/src/components/evidence/EvidenceExplorerComponents.tsx`:66 still renders:

```
{replay.byteIdentical ? 'MATCH' : 'DIFFERENCE'}
```

in pass/fail colour, affecting **UI16 EvidenceExplorer** and **CompanyTrustChain**.

⚠ This was **outside** the bounded UI17 amendment authorization and was **correctly not
modified**. UI17 was brought into conformance by ceasing to consume the component, leaving it
byte-unchanged so UI16 and CompanyTrustChain were unaffected.

**Accepting P13-B does NOT clear UI16 or CompanyTrustChain.** Remediation requires a
**separate authority act**.

### L-2 — Historical documentation debt preserved

`docs/P13_UI_SURFACE_COMPONENT_RECONCILIATION.md`:201 states *"Banking replay verified,
byte-identical"*. Preserved **unaltered under O-3** as a historical quotation.

⚠ **It MUST NOT be treated as replay-verification evidence** while AD-17/M-2 is UNRESOLVED.

### L-3 — AD-17 / M-2 remains UNRESOLVED

P13-B **removed a prohibited UI claim**. It performed **no verification** of replay, and it
**did not remediate** AD-17 or M-2. `ReplayService` still returns `reproduced` /
`byteIdentical` as **literals**. Resolution gate remains external (P15 / Existing-IIPS authority).

### L-4 — R-2 … R-7 carried and disclosed

| Ref | Limitation |
|---|---|
| R-2 | P05–P11 provider ingestion **not wired**; UI05/UI13 do not display provider market data |
| R-3 | `/api/screener/saved` **validates** definitions; it does **not persist** them |
| R-4 | Watchlist / alerts / reports / collaboration endpoints (UI07/08/09/10) **unbound** |
| R-5 | **C12 security certification remains BLOCKED**; no security certification claimed |
| R-6 | 4 of 32 P12 exports **justified as not applicable** (no artificial call sites added) |
| R-7 | **No browser / runtime evidence.** Repository presence and branch presence are established; the commit a local runtime executes is **NOT** established |

---

## 6. WHAT THIS ACCEPTANCE DOES **NOT** DO

| Item | Status |
|---|---|
| **P13-B gate acceptance** | ✅ **GRANTED (this act)** |
| P13-B certification | ⛔ **NOT GRANTED** |
| UI05 / UI13 / UI14 / UI17 certification | ⛔ **NOT GRANTED** |
| Any other certification | ⛔ **NOT GRANTED** |
| C6 / C7 certification scope | **UNCHANGED — P12 API/DTO Gate scope ONLY** |
| Production authorization / activation | ⛔ **NOT GRANTED** |
| P13 / P14 / P15 / P16 | **NOT reopened; acceptance and certification status UNCHANGED** |
| Accepted P00–P16 records | **UNCHANGED** |
| AD-17 / M-2 | ⛔ **NOT remediated — UNRESOLVED** |
| UI10 Collaboration | **DEFERRED** |
| Evidence re-anchoring (`510b453` / `2f131d9`) | **SEPARATE act — not performed** |
| `iips-platform` | **UNCHANGED** |
| Engines / methodology / scoring / taxonomy | **UNCHANGED** |
| Implementation source | **NOT modified by this act** |

**Acceptance is not certification.** These remain distinct acts and are not collapsed by this
record. **Acceptance is not production authorization.**

---

## 7. SCOPE OF THIS RECORD

This act **records the A3 gate acceptance only.** It modifies no implementation source,
certifies nothing, and authorizes no production activation.

---

**Recorded by:** Program Authority
**A3 acceptor:** Sai (D53)
**Accepted baseline:** `9e4c2e1880e6608905f9b02a5fcf794a68ee818d`
**Artifact:** `docs/D55_P13B_A3_ACCEPTANCE.md`
