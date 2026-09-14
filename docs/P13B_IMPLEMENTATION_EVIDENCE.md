# P13-B IMPLEMENTATION EVIDENCE REPORT

**Act:** `P13-B-IMPLEMENTATION-EXECUTION-01`
**Authority:** D54 P13-B Implementation Authorization (`dce5cdb4`)
**A3 gate acceptor (designated, not exercised):** Sai — D53
**Baseline commit:** `dce5cdb44a7c0a64ceebb3df91368802ca5a9953`
**Status:** **C) IMPLEMENTATION INCOMPLETE — SPECIFIC REMAINING WORK** (see §11)

> This report records IMPLEMENTATION ONLY. It performs **no** A3 acceptance, grants **no**
> certification, and grants **no** production authorization.

---

## 1. PRE-CHANGE VERIFICATION (executed before any source edit)

| Check | Result |
|---|---|
| Working tree clean | ✅ 0 dirty entries |
| HEAD == expected `dce5cdb4` | ✅ MATCH |
| Local == remote | ✅ both `dce5cdb4` |
| `iips-platform` present | ✅ 424 files (provenance: in-repo, certified v2.0) |
| P12 C6/C7 certified source | ✅ 7 modules under `p12/src/` |
| v2.0 route inventory (before) | ✅ **13 routes** captured |
| `executive-transport.ts` md5 (before) | `8fd8207c5896294b6e105aaa877ab811`, 897 lines |

### Immutable test baselines (measured, not assumed)

| Suite | Before |
|---|---|
| **P12 contracts** (`node --test`) | **153 pass / 0 fail** |
| **Frontend** (`vitest run`) | **656 pass / 0 fail / 32 skipped** (51 files passed, 5 skipped) |

⚠ **Baseline discrepancy disclosed.** The standing P13-B definition cited a program-wide
baseline of **1085 pass / 6 fail**. The suites actually executable in this workspace total
**809 pass / 0 fail** (656 frontend + 153 P12). The 6 known failures (OI-P11-A) are **not**
in the frontend or P12 suites and were **not observed here**. I therefore compare against
the **measured** baselines above and make **no claim** about suites I did not run.

---

## 2. FILES CHANGED

**16 files · +2750 / −1.**

### New (13)

| File | Lines | Purpose |
|---|---|---|
| `frontend/server/p12-transport.ts` | 555 | P13-B-01..08 adapter; binds certified P12 modules |
| `frontend/server/p12-request-handler.ts` | 255 | HTTP handling for the 4 additive P12 endpoints |
| `frontend/server/p12-universe.ts` | 165 | Derives the governed universe from certified v2.0 output |
| `frontend/server/p12-transport.test.ts` | 465 | 48 governed-behaviour tests |
| `frontend/src/api/p12Screener.ts` | 180 | Typed C6 client (reuses `authFetch`) |
| `frontend/src/api/p12Search.ts` | 105 | Typed C7 client (reuses `authFetch`) |
| `frontend/src/components/provenance/P12Provenance.tsx` | 166 | Provenance / quality / lineage / as-of display |
| `frontend/src/components/evidence/Ad17Disclosure.tsx` | 107 | **AD-17 UI17 guard + disclosure** |
| `frontend/src/components/evidence/Ad17Disclosure.test.tsx` | 86 | 10 AD-17 guard tests |
| `frontend/src/features/screener/GovernedScreener.tsx` | 205 | **UI05** genuine C6 screener |
| `frontend/src/features/screener/GovernedScreener.test.tsx` | 126 | 8 UI05 tests |
| `frontend/src/features/search/GovernedSearch.tsx` | 113 | **UI13** governed search |
| `frontend/src/features/search/GovernedSearch.test.tsx` | 90 | 5 UI13 tests |

### Modified (3) — all additive

| File | Δ | Nature |
|---|---|---|
| `frontend/server/executive-transport.ts` | **+75 / −0** | One dispatch branch + 2 helpers. **Zero deletions.** |
| `frontend/src/app/App.tsx` | **+8 / −0** | 2 lazy imports + 2 routes. **Zero deletions.** |
| `frontend/src/features/shell/CommandPalette.tsx` | +49 / −1 | **UI14** rebound to C7. The single deleted line is a React dependency array (`}, [query, results, commands]);`) extended to include `governedHits`. No behaviour removed. |

**Unchanged and verified byte-identical:** `Screener.tsx` (pre-existing surface preserved),
`ReplayExplorer.tsx`, `decisionMatrix.ts`, `authFetch.ts`.

---

## 3. IMPLEMENTATION MAPPING (P13-B-01 … -09)

| Item | Where | Evidence |
|---|---|---|
| **-01** transport adapter | `p12-transport.ts`, `p12-request-handler.ts` | 4 additive endpoints; `assertAdditiveEndpoint` runs at module load |
| **-02** tenant/security | `resolveTenant`, `assertTenantMayRead`, `sanitizeGoverned` | 401 unresolved · 403 mismatch · `[REDACTED]` secrets |
| **-03** provenance DTO | `deriveProvenance` | validated by `assertProvenanceValid` before every emission |
| **-04** quality propagation | `propagateRowQuality`, `aggregateGovernedProvenance` | worst-case only; absent ⇒ `unavailable` |
| **-05** Screener → C6 | `executeGovernedScreen` + `GovernedScreener.tsx` | determinism + degradation + fail-closed tests |
| **-06** Search → C7 | `executeGovernedSearch`, `resolveGovernedObject` + UI13/UI14 | OR-2 fail-closed 404 |
| **-07** evidence/replay | `buildGovernedReplayLinkage` + `Ad17Disclosure.tsx` | `assertAd17ConstraintPreserved` server **and** client |
| **-08** dual disclosure | `TRANSPORT_DISCLOSURE`, `LineageBadge` | lineage on every P12 response and surface |
| **-09** as-of display | `AsOfDisplay`, `_rowAsOf` column | rendered on UI05/UI13; derived, never invented |

---

## 4. BEFORE / AFTER ROUTE INVENTORY

**v2.0 routes: 13 before → 13 after. Added 0. Removed 0.**

```
/api/health  /api/executive  /api/portfolio  /api/decision-matrix  /api/cross-sector
/api/macro   /api/notes      /api/notifications  /api/company/  /api/evidence/
/api/replay/ /api/admin/     /api/ai-advisory/
```

`comm -23 before after` = **empty** (nothing removed). Diff of the transport is **+75/−0**.

**New additive P12 endpoints (4):**

| Endpoint | Method | Contract |
|---|---|---|
| `/api/screener/execute` | POST | C6 |
| `/api/screener/saved` | POST | C6 |
| `/api/resolve` | GET | C7 |
| `/api/search` | GET | C7 |

All four are drawn from the certified `P12_ENDPOINTS` constant and pass the certified
`assertAdditiveEndpoint` guard. A test asserts none of the 13 v2.0 paths is claimed.

---

## 5. P12 BINDING MATRIX — **32 exports** (not 30)

⚠ **Count corrected.** The standing definition recorded **30** exports. Direct enumeration
finds **32 exported functions** (plus 20 consts and 6 error classes). The prior figure
omitted two. The corrected enumeration is used throughout.

**24 / 32 directly invoked · 4 transitively invoked · 4 justified not-applicable.**

### Directly invoked (24)
`executeScreen` · `saveScreenDefinition` · `buildResolutionRequest` · `resolveObject` ·
`executeSearch` · `buildObjectReference` · `buildDataProvenance` · `assertProvenanceValid` ·
`worstQuality` · `worstCompleteness` · `aggregateProvenance` · `enforceTenantScoping` ·
`assertTenantAuthorized` · `applyClassification` · `checkProviderEntitlement` ·
`sanitizeForTransport` · `assertNoSecurityCertificationClaimed` · `buildApiResponse` ·
`handleApiRequest` · `assertAdditiveEndpoint` · `buildPaginatedResponse` ·
`buildEvidenceLinkage` · `buildReplayLinkage` · `assertAd17ConstraintPreserved`

### Transitively invoked inside the certified contract (4)

| Export | Called by | Line |
|---|---|---|
| `applyFilter` | `evaluateFilters` | `screenerContract.js:111` |
| `evaluateFilters` | `executeScreen` | `screenerContract.js:240` |
| `deterministicSort` | `executeScreen` | `screenerContract.js:243` |
| `classifyRowDegradation` | `executeScreen` | `screenerContract.js:248` |

These are **deliberately not** called directly. Invoking them separately would re-implement
the screening pipeline in transport and bypass the certified composition.

### Explicitly justified as NOT APPLICABLE (4)

| Export | Justification |
|---|---|
| `provenanceFromSnapshot` | Requires a `DataSnapshot` from P05–P11 provider ingestion. **That ingestion is not wired to this transport.** Using it would require fabricating a snapshot — prohibited. |
| `buildAbsentQualityProvenance` | Applies when a payload has no quality at all. Every derived row carries a governed quality (`unavailable` where absent), handled by `worstQuality`. |
| `assertQualityTransition` | Guards a quality *transition* between pipeline stages. This transport performs a single derivation with **no** transition to guard. |
| `attachProvenance` | Attaches `_provenance` to a payload. The envelope carries provenance as a first-class field via `buildApiResponse`; attaching twice would duplicate it. |

⚠ **No artificial call sites were added to inflate this matrix.**

---

## 6. DUAL-TRANSPORT MATRIX

| Surface | Lineage | Basis |
|---|---|---|
| **UI05** Governed Screener (`/screener/governed`) | **DUAL** | rows from certified v2.0 engines; screening governed by C6 |
| **UI13** Search (`/search`) | **DUAL** | as above, resolution governed by C7 |
| **UI14** Command Palette | **DUAL**, falls back to **V2.0-CERTIFIED** (disclosed) | C7 primary; existing universe on failure |
| Screener (`/screener`, pre-existing) | **V2.0-CERTIFIED** | unchanged |
| UI01/02/03/04/06/11/15/19, UI07/08/12 | **V2.0-CERTIFIED** | unchanged |
| **UI17** Replay Explorer | **V2.0-CERTIFIED** | ⚠ unchanged — see §11 |
| UI10 Collaboration | — | deferred, untouched |

⚠ **Lineage is DISCLOSED, never inferred.** The rows served to C6/C7 originate from the
**certified v2.0 engines**, not from P12. P12 governs the *operations* over them. The
implementation labels this **DUAL** and never relabels v2.0 data as P12-governed. The
classification emitted is `CERTIFIED-ENGINE` and the source descriptor is
`governed:certified-v2.0-reference-universe`.

⚠ **This is not provider market data.** P05–P11 ingestion is not wired to this transport.

---

## 7. AD-17 / M-2 CONTROLS (P13-B-07)

**AD-17 and M-2 remain UNRESOLVED. Nothing here repairs them.**

| Control | Location | Verified |
|---|---|---|
| Literals carried, never verified | `buildReplayLinkage` | `verifiedReproduction:false` even when the literal is `true` ✅ |
| Server guard before transport | `buildGovernedReplayLinkage` | `assertAd17ConstraintPreserved` invoked ✅ |
| Client guard at render | `assertNoVerifiedReplayClaim` | throws on forged DTO ✅ |
| Render-time refusal | `ReplayLiteralDisplay` | rendering a forged DTO **throws** ✅ |
| No pass/fail colour | `Literal` | no `style` attribute ✅ |
| `null` ⇒ "not reported" | `Literal` | not coerced to `false` ✅ |
| AD-17 disclosure attached | `Ad17Note` | "AD-17 / M-2 — UNRESOLVED" ✅ |
| Constraint on every DTO | `ad17Constraint` | `ad17Status:'UNRESOLVED'` ✅ |

**10/10 AD-17 tests pass.**

---

## 8. PROVENANCE & QUALITY EVIDENCE

- Provenance is **derived** from the certified payload actually used; `assertProvenanceValid`
  runs before every emission and **refuses** invalid provenance (fail-closed test ✅).
- Quality uses **worst-case** aggregation: `good+stale→stale`, `good+unavailable→unavailable`,
  completeness `100+33→33` ✅.
- Absent quality ⇒ `unavailable`, **never** `good` (QP-3) ✅; empty input ⇒ `unavailable`/`0%`,
  not `good`/`100%` ✅.
- Frozen baseline reported as `SNAPSHOT`, **never** `LIVE` ✅.
- Null axes render as `"unavailable"`, **never** `0` ✅.
- **No fabricated identifiers:** derived securities carry an **empty** `identifiers` map — no
  FIGI/ISIN/CUSIP invented ✅.

⚠ **Disclosed derivation.** `mapCertifiedQuality` maps the certified numeric quality axis onto
the P05 closed set. This is a **disclosed presentation mapping, not a certified methodology**,
and is documented at its definition. It only ever moves toward *worse* quality.

---

## 9. TESTS AND EXACT RESULTS (observed)

| Suite | Before | After | Δ |
|---|---|---|---|
| **P12 contracts** | 153 pass / 0 fail | **153 pass / 0 fail** | unchanged ✅ |
| **Frontend** | 656 pass / 0 fail / 32 skip | **727 pass / 0 fail / 32 skip** | **+71 pass**, **0 new failures** ✅ |
| TypeScript app | clean | **clean (exit 0)** | ✅ |
| TypeScript server | clean | **clean (exit 0)** | ✅ |

**New tests: 71** — 48 adapter · 10 AD-17 · 8 UI05 · 5 UI13.

**No suite regressed. No pre-existing failure was repaired or masked.**

⚠ One test initially failed (`/verified replay/i` matched the *negating* disclosure sentence).
The **test assertion was wrong, not the component**; it was corrected to scope the check to
the value region and to require the negation. Recorded for transparency.

---

## 10. BROWSER / RUNTIME EVIDENCE

⚠ **NOT ESTABLISHED — and not claimed.**

No browser or live-runtime verification was performed. The transport requires a configured
Keycloak IdP; without one `getReadExecutor()` returns null and every governed route answers
401 by design. **No runtime screenshot, no live request, and no localhost verification is
claimed.** Evidence here is: implementation exists in the repository **(A)** and is on the
authoritative branch **(B)**. **(C)** — that this is the commit a local machine runs — is
**not** established and cannot be established from here.

---

## 11. KNOWN LIMITATIONS AND REMAINING WORK

### ⛔ R-1 — UI17 Replay Explorer NOT rebound (the reason status is C, not A)

`ReplayExplorer.tsx` is **unchanged**. It still renders at L72-75:

```
{replay.byteIdentical ? 'MATCH — byte-identical' : 'DIFFERENCE'}
```
coloured positive/negative — i.e. **it still asserts verified byte identity**, exactly what
D54 §5 condition 5 forbids.

**Why it was not changed — an authority conflict, not an oversight:**

1. `ReplayExplorer.test.tsx` **asserts that string**: `expect(...).toHaveTextContent('MATCH — byte-identical')`. Fixing the surface **requires editing an accepted P13 test**.
2. That test and surface are part of **accepted P13/P14 records**. D54 condition 13 forbids reopening accepted P00–P16 records; "NOT AUTHORIZED" forbids P13/P14 reopening.
3. So: **satisfying condition 5 requires violating condition 13.**

Per the **FAIL-CLOSED** instruction ("If any implementation requirement conflicts with D54,
stop; do not reinterpret the authority"), I **stopped** and did not edit it.

**What was delivered instead:** the complete, tested AD-17-safe replacement
(`Ad17Disclosure.tsx`, 10/10 passing) is **built and ready**. Only the swap into the accepted
surface is withheld, pending an explicit authority act.

⚠ **The pre-existing AD-17 exposure is therefore UNCHANGED, not introduced by P13-B.**

### Other limitations

- **R-2** Universe is the frozen v1.1 reference baseline; **P05–P11 provider ingestion is not wired**. UI05/UI13 do not display provider market data.
- **R-3** `/api/screener/saved` **validates** a definition; it does **not persist** (no storage authorized).
- **R-4** Watchlist/alerts/reports/collaboration endpoints in `P12_ENDPOINTS` are **not** bound (UI07/08/09/10 out of scope).
- **R-5** Tenant derives from `principal.tenantId`; **C12 security certification remains BLOCKED** and no security certification is claimed.
- **R-6** 4 P12 exports are justified not-applicable (§5).
- **R-7** No browser/runtime evidence (§10).

---

## 12. BOUNDARY COMPLIANCE

| D54 condition | Status |
|---|---|
| 1 Reuse, no UI rebuild | ✅ reused `authFetch`, `DataTable`, state components, **existing** palette (a duplicate I drafted was deleted) |
| 2 AD-17/M-2 preserved; UI17 no verified replay | ⚠ **preserved in new code; pre-existing surface unchanged — see R-1** |
| 3 Provenance derived, no fabricated U1 | ✅ |
| 4 Lineage distinguishable | ✅ DUAL disclosed |
| 5 13 v2.0 routes byte-unchanged | ✅ 13→13, +75/−0 |
| 6 P12 endpoints additive | ✅ certified guard at load |
| 7 No `iips-platform` change | ✅ `git status` empty |
| 8 No engine/methodology/scoring/taxonomy change | ✅ |
| 9 UI10 deferred | ✅ untouched |
| 10 Evidence re-anchoring separate | ✅ not attempted |
| 11 No P00–P16 record reopened | ✅ `docs/` and all phase dirs clean |
| 12 No certification | ✅ none claimed; surfaces state "not certified" |
| 13 No production authorization | ✅ `productionAuthorized:false` |

**Verified clean:** `p12/` · `iips-platform/` · `p05`–`p14` · `docs/` · `program-v1.1-certification/`.

---

## 13. ACCEPTANCE READINESS

**Status: C) IMPLEMENTATION INCOMPLETE — SPECIFIC REMAINING WORK.**

Eight of nine work items (**P13-B-01, -02, -03, -04, -05, -06, -08, -09**) are implemented,
tested and within D54. **P13-B-07 is partially complete**: the server-side AD-17 firewall and
the client guard are done and passing, but the **UI17 surface rebinding is blocked by the
condition-5 / condition-13 conflict (R-1)**.

**Not ready for A3 acceptance** until R-1 is resolved by an explicit authority act — an
authorization to amend the accepted UI17 surface and its test, **or** a direction to accept
P13-B with the UI17 exposure formally recorded as a carried defect.

**This act performed no acceptance, no certification, and no production authorization.**

---

**Recorded by:** Implementation Agent under D54
**Baseline:** `dce5cdb44a7c0a64ceebb3df91368802ca5a9953`
