# HISTORICAL NSE APPLICATION INTEGRATION — PIT TRANSPORT WIRING SCOPE

**Type:** Scope preparation ONLY — no implementation, no product-code change.
**Date:** 2026-09-21
**Branch inspected:** `arena/01a0c440-iips-production-market-data` @ `da43051` (D89 Phase 1).
**Remote refs inspected (read-only, fetched for inspection only):** `origin/d114-windows-evidence`
(`1d57d0b`), `origin/d114-legacy-windows-evidence` (`4a95cd9`), `origin/main` (`eae2ff6`).
**Finding basis:** repository inspection + D114 branch inspection. No product code was modified,
no PIT semantics were touched, no acquisition was rerun, no synthetic data was created, and no
application verification is claimed by this document.

---

## CURRENT STATE

| Item | Finding |
|---|---|
| **PIT capability** | EXISTS and is tested: `p08/src/pitStorageModel.js` — `createPitStore()` (PS-1…PS-13). Strict `asOf <=` query semantics (`asOfQuery`, PS-9); append-only immutable vintages (PS-7/PS-8); vintage-ambiguity DETECTION, never resolution (PS-11); canonical-admission-only (PS-6). Declared status: `PIT_CAPABILITY.storage = 'IN_MEMORY_ONLY'`, `persistenceAuthorized: false`, `durableMediaAuthorized: false` (F-6 / D22 §5). |
| **PIT transport** | DOES NOT EXIST. `frontend/server/data-mode/data-mode.ts` hardcodes `PIT → PIT_UNAVAILABLE` (`forMode()` :107 → `buildDegradedResponse(surface,'PIT')` :63, state :68; reason: *"No point-in-time capability is wired to this transport"*; dependency: *"PIT capability exists in p08 but is NOT wired to transport; wiring it is a separate authorized act."*). D85 twin: `frontend/server/portfolio/portfolio-data-mode.ts` `portfolioForMode()` :109. **p08 imports in `frontend/server`: 0.** |
| **Historical application route** | NONE. No application route accepts a historical `asOf` query. The only `asOf` in any request contract is the P12 declared-vintage field (`/api/screener/execute` body/query `asOf`, `frontend/server/p12-request-handler.ts` :140/:250) — a *declared vintage label* over the certified SNAPSHOT universe, **not** a PIT query. |
| **Historical analysis** | NONE. All certified computations (`computeCertifiedExecutive / Portfolio / DecisionMatrix / CrossSector / Company / Evidence / Replay` in `frontend/server/executive-transport.ts`) run over the **frozen v1.1 Replay Baseline** and are labelled `freshness: 'SNAPSHOT'`. Restored NSE historical records are consumed by nothing. |
| **Production boundary** | Production activation **NOT_AUTHORIZED** (A4 at P16 only). R-2 live provider ingestion OPEN/externally blocked. D114 `OI-HIST-01` and Gate `G-004` remain **OPEN/PRESERVED**; D114 operating disposition **NON_PRODUCTION_HOLD**. NSE LIVE production ingestion is separately governed and externally gated — untouched by any of this scope. |

**Pre-existing branch condition (recorded, not fixed):** on this application branch the p08 suite
runs **87 pass / 3 fail**. The 3 failures are the "no P09–P17 leakage" scope guards
(`p08/tests/*/…:no P09–P17 leakage…`) which assert `p09/` is empty, while this application branch
legitimately carries p09 content (`p09/src/fundamentalsModel.js` et al.). **All PIT-semantics tests
(PS-*) PASS.** The guard divergence must be formally dispositioned by program authority before
acceptance floors can be asserted (see REQUIRED PRE-ACCEPTANCE TESTS, T4). It is NOT to be
"fixed" by weakening PIT semantics or deleting p09.

---

## BLOCKING SEAM

**Exact file/module/function:**

```
frontend/server/data-mode/data-mode.ts
  ├─ forMode(surface, mode, computeSnapshot)              (line 107)
  │    └─ mode !== 'SNAPSHOT' → buildDegradedResponse(surface, mode)
  ├─ dispatchForPrincipal(surface, principal, computeSnapshot, store?)   (line 124)
  │    └─ resolves UI12 mode server-side, then calls forMode
  └─ buildDegradedResponse(surface, 'PIT')                (line 63)
       └─ state: 'PIT_UNAVAILABLE'                        (line 68)
          reason: "PIT data is UNAVAILABLE … no as-of values exist to return."
          dependency: "PIT capability exists in p08 but is NOT wired to transport…"
```

Every PIT-mode request on all 7 mode-aware routes terminates at `buildDegradedResponse(surface,'PIT')`.
The D85 Portfolio twin (`frontend/server/portfolio/portfolio-data-mode.ts` :109 `portfolioForMode()`)
duplicates the same PIT branch. This — and only this — is the seam where PIT dies today.

---

## MINIMUM REQUIRED CHANGES

No certified computation, PIT semantics, D114 parser, ReplayService, byte-identity logic, or
acquisition path is modified. Seven items, in dependency order:

| # | File / module | Change | Purpose |
|---|---|---|---|
| 1 | `frontend/server/pit/pitVintageProvider.ts` **(NEW)** | Transport-side governed PIT retrieval provider. Holds one `createPitStore()` instance (p08 import — the first legitimate transport consumer), populated at boot from the governed restored corpus. Exposes `queryPit(asOf, domain, securityId)` returning the PS-9 vintage or `null`. | The single PIT retrieval point. Reuses p08 unchanged — no new store, no second store. |
| 2 | `frontend/server/pit/d114AdmissionBridge.ts` **(NEW)** | Maps D114 dual-era canonical records (`OHLCVCandle` / `MarketQuotePayload` from `src/d114/unified_historical_adapter.ts` output) into P05/P01 canonical snapshots acceptable to `store.append()` (AD-6 `snapshotId` = `data-${provider}-${dataVersion}-${asOf}`, `MD:` namespace keys, four-state quality, six version axes, scalar asOf). | PIT admits only canonical snapshots (PS-6); D114 emits its own canonical family. The bridge is the ONLY translation point. D114 parsers and p08 store both stay untouched (both ends frozen). |
| 3 | `frontend/server/data-mode/data-mode.ts` (EXTEND) | Add an optional 4th parameter to `forMode(...)`/`dispatchForPrincipal(...)`: `queryPit?: (asOf: string) => unknown`. SNAPSHOT branch and LIVE branch bodies **byte-identical, untouched**. PIT branch: if `queryPit` is bound and a vintage exists → governed PIT response; otherwise → existing `buildDegradedResponse(surface,'PIT')` unchanged. | Converts the PIT branch from a hardcoded dead-end into a governed retrieval-or-fail-closed branch. Unbound `queryPit` ⇒ today's behaviour exactly. |
| 4 | `frontend/server/portfolio/portfolio-data-mode.ts` (EXTEND or DEFER) | Same optional PIT hook for `portfolioForMode()` — **recommended DEFER**: Portfolio has no holdings-vintage contract; keep PIT_UNAVAILABLE in the first act. | Contract symmetry; zero behavioural change when deferred. |
| 5 | `frontend/server/executive-transport.ts` (EXTEND, routes only) | (a) Server-side `asOf` parse/validate on in-scope routes (PS-E3 ISO-8601-UTC-ms grammar); (b) bind per-surface PIT retrieval for **in-scope routes only**; out-of-scope routes keep the unbound PIT branch (⇒ PIT_UNAVAILABLE). | The 7 mode-aware dispatch sites :1041–:1101 stay structurally identical; only PIT-bound surfaces gain a retriever. |
| 6 | `frontend/src/api/dataMode.ts` + consumers (EXTEND) | Narrow PIT **success** responses on the existing `dataAvailable` discriminant (`true` = data, `false` = degraded → `DataModeUnavailable` unchanged). Add PIT vintage rendering only to surfaces in scope. | Consumer safety (D86 lesson generalised); no surface ever dereferences a PIT response as a SNAPSHOT shape. |
| 7 | D114 dual-era ingestion path (GOVERNED MERGE/PORT ACT — dependency gate, see D114 INTEGRATION DEPENDENCY) | Bring `src/d114/cm_udiff_parser.ts`, `legacy_bhavcopy_parser.ts`, `unified_historical_adapter.ts` (+ tests, evidence contract) onto the application branch under program authority. | Without it the bridge has no governed producer and PIT can consume only backdated fixtures, not actual NSE data. |

---

## REQUEST CONTRACT

Proposed exact shape (one new query parameter on mode-aware routes; **mode itself is NEVER
client-supplied** — it remains server-derived from the authenticated principal's persisted UI12
preference via `readPreferences`, exactly as D85/D89 established):

```
GET /api/company/:id?asOf=<ISO-8601 UTC instant with milliseconds>
    asOf ≡ /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/        (PS-E3 grammar, reused verbatim)
```

Rules (all server-enforced):

1. `asOf` is a **data-selection instant, not a mode authority**. It never selects LIVE; it never
   overrides or widens the UI12 mode. No client/query/body-supplied mode is introduced.
2. `mode = PIT` and `asOf` present and well-formed → governed PIT retrieval.
3. `mode = PIT` and `asOf` absent or malformed → governed refusal (400) — fail-closed, no default
   instant is invented. *(Single open decision point for the authority act: absent-asOf may
   alternatively map to PIT_UNAVAILABLE degraded; 400 recommended — silence would mislead.)*
4. `mode ∈ {SNAPSHOT, LIVE}` and `asOf` present → **400 governed refusal**. Never silently ignored
   (an ignored parameter is a hidden mode change).
5. Identity, tenant, owner: server-derived from the authenticated principal only (existing
   `resolvePrincipalTenant/Owner`; unchanged fail-closed tenancy).
6. No additional corpus/paging parameters in minimum scope; the served corpus is the governed
   restored set loaded at boot.

## RESPONSE CONTRACT

Two response families. The degraded family is **byte-identical to today**; the success family is new:

```jsonc
// A. PIT vintage found (NEW — success family; never emitted today)
{
  "surface": "Company",
  "dataMode": "PIT",
  "dataAvailable": true,                       // discriminant; isDegraded() narrows on false
  "query": { "asOf": "2024-07-05T00:00:00.000Z", "domain": "D02", "securityId": "RELIANCE" },
  "vintage": {
    "found": true,
    "asOf": "2024-07-05T00:00:00.000Z",        // RESOLVED vintage instant (<= requested, PS-9)
    "snapshotId": "data-<provider>-<dataVersion>-<asOf>",   // AD-6 composition, verbatim
    "provider": "<provider>", "dataVersion": "<dataVersion>",
    "quality": "good | stale | partial | unavailable",       // four-state, no fifth state
    "era": "LEGACY_BHAVCOPY | CM_UDIFF",        // D114 dual-era disclosure
    "record": { /* canonical D01/D02 fields VERBATIM — byte-identity preserved through the bridge */ },
    "pitBoundary": { /* ST-5 / MD-3 — present IFF mode is PIT (p05 contract.js :253) */ }
  },
  "provenance": {
    "dataSource": "NSE historical archives via governed D114 dual-era ingestion (Legacy Bhavcopy 2016-09-20→2024-07-07; CM-UDiFF 2024-07-08→2026-09-18)",
    "freshness": "PIT", "mode": "PIT",
    "archiveRef": "<archive file + sha256-manifest entry from the D114 evidence package>",
    "certification": "NONE — application verification only; NOT a certification claim",
    "transportSemantics": "vintage <= requested asOf; no fallback to SNAPSHOT; gaps fail-closed"
  }
}

// B. No vintage at/below asOf, PIT unbound, store empty, store error → EXISTING degraded response,
//    BYTE-IDENTICAL to current behaviour:
{ "surface": "…", "dataMode": "PIT", "state": "PIT_UNAVAILABLE", "dataAvailable": false,
  "reason": "…", "dependency": "…", "provenance": { "freshness": "UNAVAILABLE", … } }
```

## PROVENANCE REQUIREMENTS

1. **snapshotId verbatim** — AD-6 composition `data-${provider}-${dataVersion}-${asOf}`; never
   recomposed, never re-derived (PS-3/PS-6a).
2. **Resolved vintage instant disclosed** — the PS-9 `asOf` actually served (`<=` requested); the
   requested instant is echoed separately in `query`. A user must always see that they may be
   looking at an earlier vintage than asked.
3. **Provider identity never flattened** (RI-3/PN-5) — provider + dataVersion travel in the
   response; PIT series keys keep provider out of identity (OI-08/OI-09), response does not.
4. **Era disclosure** — `LEGACY_BHAVCOPY` vs `CM_UDIFF` on every vintage (the D114 dual-era fact).
5. **pitBoundary present IFF mode = PIT** — ST-5/MD-3 (`p05/src/contract.js` :253) and
   `p05/src/validate.js` :69 semantics reused, not redefined.
6. **D114 evidence chain carried** — archive reference + `sha256-manifest.json` entry +
   `historical-acquisition-manifest.json` lineage so every served value traces to a cryptographically
   attested archive file.
7. **Gap disclosure** — where a requested date is in the D114 failure registers (94 legacy
   HTTP_404 days; 34 CM-UDiFF HTTP_404 days), the response is fail-closed PIT_UNAVAILABLE and cites
   `failure-unavailable-date-register.json`. No interpolation, no nearest-vintage substitution
   beyond the strict PS-9 rule, no synthetic fill.
8. **Never relabelled** — PIT responses never claim `freshness: SNAPSHOT`/`LIVE`; SNAPSHOT
   responses never claim PIT. Certification line stays `NONE_GRANTED` — application verification
   is NOT certification.

---

## ROUTES IN SCOPE

All 7 mode-aware routes already branch on PIT at the seam; **legitimate PIT data consumption**
(additive, no certified recomputation) is narrower:

| Route | Surface | Disposition |
|---|---|---|
| `/api/company/:id` | Company / Sector Intelligence | **IN SCOPE (minimum, first act).** Payload domain = one security's market data; a PIT vintage of D01/D02 records can be disclosed without recomputing any certified engine score. |
| `/api/portfolio` | Portfolio | **CONDITIONAL — DEFERRED.** Needs a holdings-vintage contract; a PIT holdings recomputation would be a new uncertified calculation. Keep PIT_UNAVAILABLE. |
| `/api/executive` | Executive | **OUT (deferred).** Engine-aggregate over frozen baseline; PIT variant undefined. |
| `/api/decision-matrix` | Decision Matrix | **OUT (deferred).** Same. |
| `/api/cross-sector` | Cross-Sector | **OUT (deferred).** Same. |
| `/api/evidence/:id` | Evidence Hub | **OUT.** Governed certified evidence chain; no PIT contract exists. |
| `/api/replay/:id` | Replay | **OUT.** Replay/byte-identity semantics are governed (AD-17 UNRESOLVED, untouched); a "PIT replay" is not defined by any accepted contract. |

## ROUTES OUT OF SCOPE

- **`/api/macro`** — exempt from the seam entirely (WP-MACRO-03: LIVE, never SNAPSHOT; D89 §4).
  Untouched; its outstanding UI-disclosure item remains D89's own OPEN item, not this scope's.
- **`/api/screener/execute`, `/api/search`** (P12 additive routes) — **not mode-aware**; D89 Phase 2
  explicitly deferred them. Their existing `asOf` is a declared-vintage label over SNAPSHOT data,
  NOT a PIT query. Extending them is a separate act.
- All non-market-data routes (`/api/settings`, `/api/watchlists`, `/api/reports`, `/api/notes`,
  `/api/notifications`, `/api/collaboration`, `/api/ai-advisory/*`, `/api/admin/*`, `/api/replay/*`
  admin paths) — no PIT semantics.

## UI SURFACES IN SCOPE (of the existing surfaces)

- **Company Intelligence** (`frontend/src/features/company/CompanyIntelligence.tsx`) — the one
  surface that can render a PIT vintage in the first act (vintage disclosure panel; PIT provenance
  rendered verbatim; degraded path unchanged via `DataModeUnavailable`).
- **Settings / UI12** (`frontend/src/features/settings/Settings.tsx`) — already offers PIT as the
  account default; **no change needed** for mode selection.
- **OUT (keep rendering `DataModeUnavailable` for PIT):** `ExecutiveDashboard`,
  `PortfolioWorkspace`, `DecisionMatrix`, `CrossSectorIntelligence`, `SectorIntelligence`,
  Evidence/Replay explorers — until their deferred route contracts exist. `isDegraded()` +
  `dataAvailable` narrowing is extended, never bypassed; no zeroed/placeholder rendering.

---

## LIVE/SNAPSHOT PRESERVATION

1. **SNAPSHOT branch untouched:** `forMode`'s SNAPSHOT path still invokes the certified computation
   unchanged and returns it verbatim. The D54 §97 gate stays pinned by the EXISTING unmodified
   tests: `JSON.stringify(forMode(name,'SNAPSHOT',fn)) === JSON.stringify(fn())` plus `toBe`
   identity, for all 7 certified computations. If any wiring change breaks those tests AS WRITTEN,
   the wiring is wrong — STOP.
2. **LIVE branch untouched:** `LIVE_UNAVAILABLE` citing R-2; never falls back, never substitutes.
3. **Default unchanged:** no preference / no resolvable owner ⇒ SNAPSHOT (pre-D85/D89 behaviour).
4. **No new mode authority:** `asOf` is a data-selection parameter; the seam still accepts mode
   only from `readPreferences` (server-derived). Test-pinned.
5. **Certified computations unchanged:** no `computeCertified*` signature or output change;
   frozen v1.1 Replay Baseline inputs unchanged; iips-platform, p05–p14 product code, ReplayService,
   byte-identity logic: 0 changes.
6. **Macro untouched:** exemption dispatch block and LIVE freshness preserved (pinned by existing test).

## FAIL-CLOSED REQUIREMENTS

1. **Unbound `queryPit` ⇒ today's PIT_UNAVAILABLE exactly** — routes out of scope never gain data.
2. **Empty store / no vintage ≤ asOf / pre-2016-09-20 instant ⇒ governed `PIT_UNAVAILABLE`** —
   never a SNAPSHOT fallback, never a substituted value, never an empty-but-shaped payload.
3. **Store or bridge error ⇒ PIT_UNAVAILABLE** (fail-closed; partial results are not served).
4. **Malformed / absent `asOf` under PIT ⇒ 400** governed refusal (no invented default instant).
5. **Vintage ambiguity (PS-E9 at append; PS-11 detection) ⇒ refuse + report** — never resolved,
   never ranked, never a winner picked (resolution remains P07-03's accepted contract).
6. **Era gaps (failure registers) ⇒ fail-closed** — the 94 legacy + 34 CM-UDiFF HTTP_404 days are
   unavailable, disclosed, never interpolated.
7. **PIT store stays IN_MEMORY_ONLY** — no disk write, no network, no credentials introduced by the
   transport wiring; persistence remains a separate authorized concern.
8. **Re-append of conflicting vintages is impossible** through the bridge — PS-E9 rejection is the
   guarantee that restored data can never silently overwrite a vintage.

---

## D114 INTEGRATION DEPENDENCY

**Exact finding:** The dual-era D114 ingestion/parser capability is **NOT on this application
branch** and cannot be assumed present.

- It exists on **diverged governed branches**: `origin/d114-windows-evidence` (`1d57d0b`; 10 commits
  over baseline `eae2ff6`: `da4e5b5` CM-UDiFF parser → `5556fe5` legacy Bhavcopy parser + unified
  dual-era adapter → `6a9b01d`/`7f3f7a9` hardened runner + reconciler → `8a330bb`/`f84d489`
  Windows→Arena handoff contract/intake → `1d57d0b` six-file evidence deposit) and
  `origin/d114-legacy-windows-evidence` (`4a95cd9`; +5 commits: `9dd8bc3` Stage-4 authority
  decision **OPTION A** (legacy 2016-09-20→2024-07-07, OFFLINE_BOOTSTRAP, NON_PRODUCTION_HOLD) →
  `42fb16c` Stage-4 dual-era routing/evaluation/materialize runner → `4a95cd9` legacy evidence
  deposit).
- The branch trees are **structurally divergent**: D114 lineage uses a root-level `src/` + `tests/`
  layout (wave4/WSF/WSG structure); this application branch uses `frontend/` + `iips-platform/` +
  `p05`–`p14`. This is not a fast-forward; it is a governed merge/port with tree-layout
  reconciliation.
- The **materialized archives live only on the Windows host** (`C:\IIPS_Data\NSE_Legacy_Acquisition\archives`,
  `C:\IIPS_Data\NSE_CM_UDiFF_10Y\archives`). The repo carries the attested evidence packages
  (manifests, SHA-256, coverage, integrity, failure registers) — not the archives themselves.
  The transport corpus loader must consume the Windows-restored archives through the D114
  handoff/intake contract (`src/d114/evidence_handoff.ts` intake loader), never by improvising a
  second reader.

**Determination:** A governed D114 merge/port act **IS required before PIT transport can consume
actual NSE data** (question 12: YES). It is **NOT required** for the wiring itself to be built and
proven against p08's existing backdated fixtures. Wiring may be implemented and tested fixture-side
first; actual-NSE consumption is gated on the merge/port act. The two must not be conflated into
one silent step.

## PIT PERSISTENCY DEPENDENCY

**Exact finding:** `PIT_CAPABILITY.storage = 'IN_MEMORY_ONLY'` (`persistenceAuthorized: false`,
`durableMediaAuthorized: false`, authority F-6/D22). For **this application verification**,
IN_MEMORY_ONLY is **sufficient**, subject to an honest bound: the dual-era corpus is ~2,587 valid
trading days; at full NSE symbol breadth that is a multi-GB in-process store. The verification
must therefore run on a **governed bounded corpus** (specified securities and/or date windows
loaded at boot) — or the verification host must provision memory accordingly. **Durability
(disk persistence of the PIT store) is a SEPARATE authorized concern** requiring its own F-6-style
authority act; it must NOT be bundled into the wiring act, and the wiring must not smuggle
persistence in. If a future verification requires durable PIT, that is a new act with new evidence.

## DEPENDENCY CHAIN (question 13, exact)

```
Windows host archives (C:\IIPS_Data\…, OUTSIDE repo)
   └─ D114 dual-era ingestion (BRANCHED, not merged):
        cm_udiff_parser.ts · legacy_bhavcopy_parser.ts · unified_historical_adapter.ts
        + evidence_handoff intake + 6-file evidence packages (SHA-256 attested)
         └─ [GOVERNED MERGE/PORT ACT → application branch]   ← gate for ACTUAL NSE data
             └─ d114AdmissionBridge (NEW: D14 canonical → P05/P01 canonical snapshot)
                 └─ p08 createPitStore().append()  (UNCHANGED, IN_MEMORY_ONLY)
                     └─ pitVintageProvider (NEW: boot-load governed corpus + queryPit, PS-9)
                         └─ data-mode seam forMode/dispatchForPrincipal (EXTENDED PIT branch)
                             └─ executive-transport route dispatch (asOf parse + per-surface binding)
                                 ├─ /api/company/:id → CompanyIntelligence (IN SCOPE UI)
                                 └─ all other mode-aware routes → DataModeUnavailable (unchanged)
   Analysis engines (iips-platform) ── UNCHANGED (frozen baseline; PIT does NOT feed engines
   without a separate authority act) · ReplayService ── UNCHANGED · UI12 settings ── UNCHANGED
```

---

## REQUIRED PRE-ACCEPTANCE TESTS

New tests that must exist and pass **before** Windows application acceptance begins:

- **T1 — Seam extension (extend the D89 test patterns, do not weaken them):** PIT branch with
  bound retriever returns the governed PIT success shape; PIT with unbound retriever / empty store /
  no vintage ≤ asOf returns byte-identical `PIT_UNAVAILABLE`; `asOf` on SNAPSHOT/LIVE → 400;
  malformed/absent `asOf` under PIT → 400; mode still server-derived only; SNAPSHOT byte-identity
  suite (all 7) passes **AS WRITTEN**; LIVE and Macro pins pass AS WRITTEN.
- **T2 — PIT retrieval provider:** PS-9 strict `<=` semantics observable at the transport boundary;
  resolved-vintage vs requested-instant disclosure; response-contract shape freeze; provenance
  completeness (era, snapshotId, sha256 ref, pitBoundary); PS-11 ambiguity → refusal.
- **T3 — Admission bridge:** D114 CM-UDiFF and legacy fixtures → canonical snapshots admitted
  UNCHANGED by `store.append()`; byte-identity of records through the bridge; idempotent re-append;
  PS-E9 vintage-ambiguity rejection; era-boundary continuity check (2024-07-07 → 2024-07-08);
  failure-register dates → fail-closed (no vintage invented); **0 modifications to D114 parsers
  and 0 to p08** (asserted by import/guard tests).
- **T4 — Guard reconciliation (pre-existing):** the 3 currently-failing p09-leakage scope guards on
  this branch must be **green or formally dispositioned by program authority** before any floor is
  asserted. Do not "fix" them by touching p09 or p08 semantics.
- **T5 — Suite floors after wiring:** frontend vitest ≥ 1033 + Δ new, **0 failed**; p08 90/0
  (post-T4); P12 154/0; P13 86/0; app tsc + server tsc clean; D89 38-test suite green in its
  preserved parts plus the new PIT-branch tests.

## WINDOWS ACCEPTANCE TESTS

Executable **only after** the wiring (and the D114 merge/port for actual data) is complete:

- W1 — Windows host serves the app transport with the governed corpus loaded from
  `C:\IIPS_Data\…` via the D114 intake contract; boot log attests corpus bounds and SHA-256 pass.
- W2 — UI12 default = PIT → `/api/company/:id?asOf=…` returns a restored vintage with era +
  provenance for a known symbol/date in BOTH eras (one legacy date < 2024-07-07, one CM-UDiFF date
  ≥ 2024-07-08); UI renders it with provenance verbatim.
- W3 — Fail-closed matrix on Windows: asOf on a registered HTTP_404 day, a weekend/holiday, a
  pre-2016-09-20 instant, and a post-2026-09-18 instant → each returns `PIT_UNAVAILABLE` with
  truthful reason; UI shows `DataModeUnavailable`; no fallback, no placeholder values.
- W4 — SNAPSHOT regression: identical UI12=PIT user switches to SNAPSHOT → certified payloads
  byte-identical to pre-wiring baseline (spot-check JSON equality on all 7 surfaces).
- W5 — LIVE still `LIVE_UNAVAILABLE` (R-2); Macro still LIVE/exempt.
- W6 — Evidence deposit per the D114 handoff pattern (screenshots + request/response JSON + corpus
  bounds), marked **application verification, NOT certification**.

## ALREADY-COMPLETED WORK NOT TO REOPEN

1. **D114 acquisitions** — CM-UDiFF 10Y acquisition (2024-07-08→2026-09-18 era; 668 ACQUIRED_VALID)
   and Stage-4 legacy acquisition (2016-09-20→2024-07-07; 1,919 ACQUIRED_VALID; 94 documented
   HTTP_404): **DO NOT RERUN**. Evidence packages, SHA-256 manifests, integrity/schema/coverage
   reports, failure registers, Stage-4 authority decision — complete and deposited.
2. **D114 parsers + tests** on the D114 branches (`wsh_d114_historical_feasibility.test.ts` et al.).
3. **P08 PIT storage model** (PS-1…PS-13) and its tests — PIT semantics are closed; the wiring
   consumes, never amends.
4. **P05 PIT refusal** (`localFeed.js` A-6/A-8, preflight E6) — deliberately untouched by P08 and
   untouched by this scope.
5. **D85 / D86 / D88 / D89 records** and their test pins — extended, never edited.
6. **Certified engines, frozen v1.1 Replay Baseline, byte-identity logic, ReplayService, AD-17**
   (UNRESOLVED — untouched), **P12/P13 surfaces**, **UI12 settings journal**, **RBAC/executors**.
7. **Production gates** (A4 at P16; R-2; OI-HIST-01; G-004) — none reopened by this scope.

## PRODUCTION BOUNDARY

This scope connects an existing, governed, IN_MEMORY_ONLY PIT capability to the application
transport for **application verification only**. It does NOT authorize production activation
(A4 remains at P16), does NOT touch R-2 live provider ingestion (OPEN, externally gated), does NOT
touch NSE LIVE production ingestion (separately governed, externally gated), does NOT discharge
OI-HIST-01 or Gate G-004 (remain OPEN/PRESERVED per the D114 Stage-4 authority decision), does NOT
constitute certification (NONE_GRANTED), and does NOT alter the D114 NON_PRODUCTION_HOLD
disposition. "PIT transport wiring" ≠ "NSE LIVE production ingestion."

## IMPLEMENTATION AUTHORITY REQUIRED

**YES.** The wiring crosses three explicitly recorded boundaries, each of which names a separate
authorized act as its gate: D89's seam declares PIT wiring "a separate authorized act"; F-6/D22
scoped P08 to the storage model only ("wiring any P05 adapter to it is not authorized by F-6");
and D85 §3 recorded the p08→transport wiring as OUT OF SCOPE. No existing authority covers it.
Implementation must not begin until the authority decision below is recorded (as a D-series act)
and the D114 merge/port authority question is answered in the same or a preceding act.

## REPOSITORY CHANGES

**NONE — SCOPE PREPARATION ONLY.** This document is the sole artifact created. No product code,
tests, semantics, acquisition, or governance records were modified.

## GIT DURABILITY

No implementation commit. This scope document is committed and pushed to the session branch
`arena/01a0c440-iips-production-market-data` after diff verification.

## NEXT EXECUTABLE ACTION

Implementation authority is **required**. The exact authority decision prompt:

```
AUTHORITY DECISION REQUESTED — D-PIT-WIRE-01 (HISTORICAL NSE APPLICATION INTEGRATION)

Decide, as a recorded governance act:

 1. AUTHORIZE PIT transport wiring (scope = docs/PIT_TRANSPORT_WIRING_SCOPE_PREPARATION.md,
    MINIMUM REQUIRED CHANGES items 1–6) as an additive act: PIT branch of the data-mode seam,
    one new retrieval provider, one admission bridge, per-surface binding for /api/company/:id
    ONLY. SNAPSHOT/LIVE/Macro/certified computations/ReplayService/byte-identity: 0 changes.
 2. CONFIRM the request/response contracts as proposed (including the single open decision
    point: absent asOf under PIT → 400 [recommended] vs PIT_UNAVAILABLE).
 3. CONFIRM first-act route scope: /api/company/:id IN; Portfolio, Executive, Decision Matrix,
    Cross-Sector, Evidence, Replay, P12 additive routes, Macro OUT (PIT_UNAVAILABLE or exempt).
 4. CONFIRM PIT persistence stays IN_MEMORY_ONLY with a governed bounded verification corpus;
    durability explicitly deferred to a separate future act.
 5. DIRECT the D114 dual-era ingestion merge/port question: authorize a merge/port act bringing
    cm_udiff_parser + legacy_bhavcopy_parser + unified_historical_adapter + handoff intake onto
    the application branch — REQUIRED before actual NSE data flows (fixture-side wiring tests
    may proceed without it). Merge order/layout reconciliation included in that act's scope.
 6. DISPOSITION the 3 pre-existing p09-leakage guard failures on this branch (T4) so suite
    floors can be asserted truthfully.
 7. RESTATE the boundaries: no production activation (A4@P16), no R-2 change, no certification,
    OI-HIST-01 / G-004 remain OPEN, D114 NON_PRODUCTION_HOLD preserved, acquisition NOT rerun.

Reply with the decision (e.g. "D-PIT-WIRE-01 = A with §5 split into D-PIT-WIRE-02") to authorize
implementation; any reply that is not an explicit authorization leaves the repository unchanged.
```

No implementation was performed during this scope-preparation activity.
