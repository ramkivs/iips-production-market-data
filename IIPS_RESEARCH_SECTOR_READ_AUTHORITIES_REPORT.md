# IIPS — Research & Sector Intelligence: SNAPSHOT Read Authorities (Prompt 2B of 3)

**Status:** COMPLETE — implementation, tests, and durability checkpoint delivered.
**Gate:** NON_PRODUCTION SNAPSHOT infrastructure only. D115 implementation authority NOT granted.
Production authorization NOT granted. Provider activation NOT granted. Windows artifacts untouched.
**Surface recovery:** NOT attempted, NOT claimed. Company Intelligence and Sector Intelligence UI
remain unrecovered; no route or navigation wiring was performed.

---

## 1. Exact baseline

| Item | Value |
| --- | --- |
| Baseline commit | `bac1467aa66889bac6814e35c9bf72c53dd7bf28` (Prompt-2A tip) |
| Baseline tree | `15d4bb641497dc3d07baf7c8f5f993ce76ac529a` |
| Baseline parent | `fcca6697d422fadf2c4cf9bf8b3fc693731ee9da` (Prompt-1 governing forensic manifest) |
| Governing specification | `IIPS_RESEARCH_SECTOR_RECOVERY_MANIFEST.md` (artifact sha256 `6cb0ca081c43779e1d439d4ff8d62f03d6ecff4ac34dd0eb368e862d6fae9815`) |
| `main` | `4d3e1cdcaa33…` — unchanged; no merge, no rebase, no force-push |
| Lineage | `4d3e1cd` → `ea70a8c4` (Stage 4) → `43c3e0dc` (build fix) → `fcca6697` (manifest) → `bac1467` (Prompt 2A) |
| History policy | `da43051` was **not** used as an implementation parent |

Recovered dependency used, not re-implemented:

* `computeCertifiedPlatform()` @ `src/transports/executive_transport.ts:156` — returns
  `{ engineOutputs, engineDetails, csip }`; `engineDetails[sector]` = `{ sector, verdict, composite,
  overrides, pillars, resolvedSubsegment?, resolvedArchetype?, calibrationVersion?, inputs }`;
  `engineOutputs[i]` carries the golden-derived `confidence` / `qualityScore` / `valuationScore`;
  `csip` = `CrossSectorEngine.run({ portfolioId: 'PF-REAL', scenario: 'Balanced', strategy:
  'Balanced', outputs, topN: 10 })` exposing `intelligence.{avgConviction,avgQuality,holdings}`.

---

## 2. Per-authority status

| # | Authority | Data mode | Provenance | Status |
| --- | --- | --- | --- | --- |
| R-4 | `GET /api/company/:id` | SNAPSHOT | FROZEN SNAPSHOT / certified derivation | **IMPLEMENTED · VERIFIED** |
| R-5 | `GET /api/decision-matrix` | SNAPSHOT | FROZEN SNAPSHOT / certified derivation | **IMPLEMENTED · VERIFIED** |
| R-6a | `GET /api/evidence/:id` | SNAPSHOT | FIXTURE / D79 transport fixture constants | **IMPLEMENTED · VERIFIED** |
| R-6b | `GET /api/replay/:id` | SNAPSHOT | FIXTURE / D79 transport fixture constants | **IMPLEMENTED · VERIFIED** |

No authority is `SAFE BUT DEFERRED` or `BLOCKED`. All four were proven safely isolable in Task 1:
none requires a PIT dependency, none requires donor dispatch, none requires the auth tier, and none
requires any Decision Matrix / Evidence / Replay UI component.

Deliberately **not** implemented (out of scope, unchanged status):

| Item | Status | Reason |
| --- | --- | --- |
| `GET /api/company/:id?asOf=` (PIT/D114 vintage) | **EXCLUDED** | Data selection over PIT + D114 persisted vintage → PIT branch, explicitly out of scope |
| `guardRead` / RBAC / Keycloak-OIDC auth tier | **NOT RECONSTRUCTED** | Prohibited. No bypass created — see §7 |
| `GET /api/ai-advisory` | **NOT TOUCHED** | Separate ownership (`f63a9b49…`); excluded |
| `GET /api/macro` (MoSPI) | **NOT TOUCHED** | LIVE provider surface; excluded |
| Company / Sector UI, Decision Matrix / Evidence / Replay UI, App.tsx routes, navigation | **NOT RECOVERED** | Prompt-3 scope |
| Donor `frontend/server/executive-transport.ts` dispatch | **NOT RECOVERED** | Excluded (62 files / 188-file closure); see §8 |

---

## 3. Exact files changed

Two files added. No existing file was modified.

| File | Change | Lines | Note |
| --- | --- | --- | --- |
| `frontend/server/research-sector-transport.ts` | **added** | new | Single current-lineage server module hosting the four thin mappers, the SNAPSHOT request handler, and a minimal non-production HTTP host |
| `tests/research_sector_read_authorities.test.ts` | **added** | new | 27 `node:test` guards (RA-01 … RA-27) |
| `IIPS_RESEARCH_SECTOR_READ_AUTHORITIES_REPORT.md` | **added** | new | This report |

Verified byte-unchanged by test **RA-26** (recorded baseline sha256):

| File | sha256 | Why it matters |
| --- | --- | --- |
| `frontend/src/app/App.tsx` | `f2d307e54c17…83b` | No route wiring; structural placeholders remain placeholders |
| `frontend/src/app/navigation.ts` | `11b253ac8cab…cb9` | No navigation change |
| `frontend/src/app/routes.ts` | `e3ddfc47dd40…85b` | No route added |
| `frontend/server/executive-transport.ts` | `79d62cea4562…fb2` | The Stage-4 server was not modified; the donor dispatch was not restored |

Verified byte-unchanged by test **RA-25**: all five browser API clients
(`authFetch.ts`, `dataMode.ts`, `evidence.ts`, `executive.ts`, `replay.ts`) — **no client wrapper
was added**, so the browser reaches these authorities over HTTP only.

**Smallest module set:** one server module. Task 1 confirmed the four mappers share a single
projection of `computeCertifiedPlatform()` and a single SNAPSHOT request contract, so splitting
them into four modules would have duplicated the projection, not reduced coupling.

---

## 4. Provenance per authority

| Authority | `provenance.dataSource` | Verified by |
| --- | --- | --- |
| `/api/company/:id` | `certified v2.0 platform (frozen sector engine) over frozen v1.1 Replay Baseline inputs` | RA-04 |
| `/api/decision-matrix` | `certified v2.0 platform (CSIP NormalizedHolding quality/valuation + certified engine outputs) over frozen v1.1 Replay Baseline inputs` | RA-09 |
| `/api/evidence/:id` | `transport fixture constants over frozen v1.1 Replay Baseline inputs — reproduced/byteIdentical are hardcoded by executive-transport, NOT produced by a runtime replay or EvidencePipeline verification` | RA-10, RA-12 |
| `/api/replay/:id` | `transport fixture constants over frozen v1.1 Replay Baseline inputs — reproduced/byteIdentical are hardcoded by executive-transport, NOT produced by a runtime ReplayService verification` | RA-11, RA-12 |

Every authority additionally reports `freshness: 'SNAPSHOT'`, `calibratedAt:
'2026-08-09T00:00:00.000Z'`, and `transportSemantics: '1:1 mapping; transport transformation !=
decision transformation'` — matching the manifest §3 designation verbatim.

**D79 attribution (L-3).** `reproduced: true` and `byteIdentical: true` are **hardcoded transport
fixture constants**. Neither authority invokes `ReplayService` or `EvidencePipeline`, and no runtime
verification is claimed. Both disclosure strings were compared **byte-for-byte** against the donor
(including the U+2014 em dash) and are **identical**: replay 185 chars, evidence 198 chars
(`EXACT MATCH replay: True`, `EXACT MATCH evidence: True`). AD-17 / M-2 remain **UNRESOLVED**.

**Documented deviation from the donor (one, and only one).** The donor's evidence mapper emitted
`value: typeof value === 'number' ? value : 0` for *every* governed input key. The frozen v1.1
Replay Baseline carries **26 string descriptors** across 9 of the 13 sectors (`id`, `businessModel`,
`segment`, `subsegment`, `archetype`, `commodityExposure`, `regulatoryPosture`), so the donor's
coercion produced fabricated metrics such as `{ id: 'id', name: 'id', value: 0 }`. Under the standing
instruction *do not fabricate payloads*, only genuinely numeric governed inputs are emitted as
`keyMetrics`; descriptors are not metrics and are not restated. This is disclosed in the module
(`DOCUMENTED DEVIATION FROM THE DONOR MAPPERS`), enforced by test **RA-27** against the frozen
baseline read independently, and **flagged here for review**. No other behaviour deviates: the
decision-matrix mapper was diffed against the donor body and is behaviourally identical (quality from
the governed CSIP mapping, `valuation` `null` where the engine exposes no valuation pillar).

---

## 5. Payload / hash evidence

Canonical `sha256(JSON.stringify(payload))`, measured against the compiled module:

| Authority | Bytes | sha256 |
| --- | --- | --- |
| `GET /api/company/Banking` | 973 | `f58fc01d8123c65488ee44ed0e7b95843c266faff1aab06b143e544046dec02e` |
| `GET /api/company/Capital Markets` | 949 | `3a17f8b654ab80bec13647b0885b03b070d7e684727ff9bf28d43d7470264ad9` |
| `GET /api/company/Technology` | 1262 | `39603becbcc7e913b000b67cdfa119faf81f7012f772c4f44f43e01c60b7c034` |
| `GET /api/decision-matrix` | 2184 | `ab474c5ae12149fab1044f2f5379810628c5046e71df932643d6ff7f5d6b4e97` |
| `GET /api/evidence/Banking` | 2036 | `a95f0e309d1b4aad9df1357f87dddee1c7756aac0c51c84e369cbcce1f1df48f` |
| `GET /api/replay/Banking` | 1045 | `92ef775286cb335053805332a0887310e0ebc6ebfd51129432f5e19607b2e1b4` |

Determinism: three independent invocations produced **IDENTICAL** digests for
`/api/company/Banking`, `/api/company/Technology`, and `/api/decision-matrix` (RA-03, RA-09, RA-13
assert byte-stability for all 13 sectors).

**Equivalence to the certified source (RA-02, RA-07, RA-13, RA-27).** The suite reads the frozen
fixtures independently of the module — `program-v1.1-certification/PROGRAM_v1.1_REPLAY_BASELINE.json`
and each `iips-platform/src/sector-engines/<dir>/[frozen-assets/]<dir>-expected-outputs-1.0.0.json` —
and asserts that every returned figure equals it: composite, confidence (or `null`), pillars (or
`null` — never `{}`), valuation axis (or `null`), and the 26 numeric input metrics. This proves the
module performs **no duplicated platform computation** and **no re-derivation**.

Live HTTP evidence (real `node:http` server, ephemeral port):

```
200  /api/health
200  /api/company/Banking                              -> {"companyId":"Banking-H1","sector":"Banking",
                                                          "decision":{"verdict":"Watch","composite":47.1,"confidence":0.8},…}
200  /api/company/capital%20markets                    -> case-insensitive resolution -> "Capital Markets-H1"
200  /api/decision-matrix                              -> {"matrixType":"scatter",…,"companies":[13 rows],…}
200  /api/evidence/Technology                          -> {"evidenceId":"ev_Technology","keyMetrics":[{"id":"ebitdaMargin",…}]}
200  /api/replay/Insurance                             -> {"snapshotId":"snap_Insurance","reproduced":true,"byteIdentical":true,…}
404  /api/company/Nope                                 -> {"error":"Error: company not found: Nope"}
400  /api/company/Banking?asOf=2026-06-30T00:00:00.000Z -> asOf refused, donor wording verbatim
404  /api/company/                                     -> malformed target refused
405  POST /api/company/Banking                         -> {"error":"method-not-allowed","allowed":"GET"}
```

---

## 6. Tests and results

`node:test` only. **No new framework, no vitest, no jsdom, no testing-library, no new devDependency.**

| Command | Result |
| --- | --- |
| `npm run build:tsc` | **exit 0** |
| `node --test dist/tests/research_sector_read_authorities.test.js` | **27 tests / 5 suites / 27 pass / 0 fail** |
| `npm run build:vite` | **exit 0** |
| `node --test dist/tests/*.test.js` (full regression) | **600 tests / 95 suites / 600 pass / 0 fail** |

Full-regression delta versus the Prompt-2A baseline (`573 / 90 / 0 fail`): **exactly +27 / +5**, i.e.
this suite and nothing else — no pre-existing test was modified or suppressed.

Coverage against the required minimum:

| Required | Guards |
| --- | --- |
| Valid company sector/id response | RA-01, RA-05, RA-19 |
| Deterministic payload | RA-03, RA-09, RA-13 |
| Payload provenance | RA-04, RA-09, RA-10, RA-11 |
| Decision-matrix ordering / content | RA-06, RA-07, RA-08, RA-09 |
| Evidence D79 attribution | RA-10, RA-12, RA-27 |
| Replay D79 attribution | RA-11, RA-12 |
| Malformed / unknown input fails closed | RA-15, RA-16, RA-17, RA-19 |
| No provider / network access | RA-22 |
| No PIT branch | RA-17, RA-18 |
| No browser import of server/Node transport | RA-21, RA-24, RA-25 |
| Already-certified payload hashes where available | RA-02, RA-07, RA-13, RA-27 (fixture equality; §5 digests) |

Not asserted, and **not claimed**: Company/Sector UI rendering and the E2E-018 43/40-key visual
parity. Parity is only proven for the Executive surface (Stage 3, 41/41); these two surfaces were
never parity-verified (manifest blocker **B-5**).

---

## 7. Browser-boundary verification

* **The authority module is not in the browser graph.** `npm run build:vite` produced a
  byte-identical bundle: **1,487,184 B** (unchanged from Prompt 2A). `grep -o` occurrence counts for
  `research-sector`, `X-IIPS-Certification`, `api/decision-matrix`, `computeCertifiedDecisionMatrix`,
  `computeCertifiedCompany`, `computeCertifiedEvidence`, `computeCertifiedReplay` in
  `dist-frontend/assets/index-r_kDpDh4.js`: **all 0**. (The two `researchSector` hits are the
  pre-existing `ROUTES.researchSector` placeholder in the baseline.) No new Node-only module entered
  the Vite graph.
* **RA-24:** no file under `frontend/src/**` references `research-sector-transport`, and no file
  imports a `node:` builtin.
* **RA-25:** all five browser API clients are byte-unchanged; **no client wrapper was added**, so the
  browser talks to the four authorities over HTTP only. For the record, the **pre-existing**
  `frontend/src/api/executive.ts` import of the *Executive* transport is a baseline condition owned
  by the Executive surface — it is neither relied upon nor extended here.
* **RA-21:** the module's complete import list is exactly `node:http` and
  `../../src/transports/executive_transport.js`. Nothing else.
* **No authentication bypass.** The authority performs no authentication and no authorization. It
  does **not** reconstruct `guardRead`, RBAC, or the Keycloak/OIDC tier, and it does not pretend to
  be protected: every response carries
  `X-IIPS-Authentication: NONE (non-production, unauthenticated development transport)` and
  `X-IIPS-Certification: NONE CLAIMED`, and the module header states it must not be exposed beyond a
  local non-production development boundary. The only authentication statement made anywhere is the
  truthful one that none was performed.

---

## 8. Confirmation: no donor dispatch, auth, PIT, or UI recovered

Enforced by source scan (RA-22, RA-23) over comment-stripped code, plus RA-21's exact import list:

| Excluded item | Evidence |
| --- | --- |
| Donor `frontend/server/executive-transport.ts` dispatch | Not imported, not copied. `frontend/server/executive-transport.ts` is **byte-unchanged** (`79d62cea4562…fb2`, RA-26). The donor module is named **only** inside the two verbatim D79 attribution literals — asserted, so it cannot appear as an import, path or dispatch |
| Auth tier (`guardRead`, `secured-executor`, Keycloak, OIDC) | Tokens absent from code; nothing reconstructed; no bypass (see §7) |
| PIT vintage branch (`PitVintageProvider`, `p08PitStore`, `d114AdmissionBridge`) | No PIT import, no `asOf` support, no mode authority. `asOf` is **refused** 400 with the donor's wording verbatim on all four authorities; duplicate/ambiguous `asOf` refused identically; an unrecognised selector is also refused rather than discarded |
| D114 / D115 | Untouched — no import, no reference, no implementation |
| AI Advisory | Not imported; `/api/ai-advisory` not exposed |
| Macro / MoSPI | Not imported; `/api/macro` not exposed |
| Provider / network / credentials / filesystem | No `fetch(`, `XMLHttpRequest`, `WebSocket`, `EventSource`, `http(s)://`, `process.env`, `apiKey`, `credential`, `secret`, `readFileSync`, `node:fs`, `node:path`, `child_process` anywhere in the module |
| Decision Matrix / Evidence / Replay **UI** | No component added, mounted or referenced. The Decision Matrix authority returns certified axis scores only and fabricates **no** quadrant/band/threshold (RA-08); the certified platform exposes none, and matrix positioning stays the UI's business — which is why **no Decision Matrix UI recovery is implied or performed** |
| `?asOf=` D114/D115 components | Excluded; the `asOf` link is refused, not served |
| Company/Sector UI, route & navigation wiring | None. `App.tsx`, `navigation.ts`, `routes.ts` byte-unchanged (RA-26); the existing `structural(...)` placeholders still read *"No company data is fabricated."* / *"No matrix, scores, or weights are fabricated."* |
| Testing frameworks | No vitest / jsdom / testing-library; no dependency added |

Fail-closed behaviour: unknown or unresolvable sector → `404` naming the reason and substituting
nothing; malformed/empty/embedded-slash/undecodable target → `404`; non-GET → `405`; query selection
under SNAPSHOT → `400`. No default sector, no fallback, no silent substitution, no fabricated metric
(§4), and no fabricated zero for an absent axis.

---

## 9. Commit SHA

| | |
| --- | --- |
| Implementation commit | **`fc5ab69186a7e0dd82d676a54aeb35f90f580bdc`** |
| Contents | `frontend/server/research-sector-transport.ts` (+553), `tests/research_sector_read_authorities.test.ts` (+447), `IIPS_RESEARCH_SECTOR_READ_AUTHORITIES_REPORT.md` (+289) — 3 files, 1289 insertions |
| Parent | `bac1467aa66889bac6814e35c9bf72c53dd7bf28` (Prompt-2A tip) |
| Tree delta | 3 added files; **no existing file modified** |

## 10. Remote SHA

Pushed to `origin/arena/01a0d1d3-iips-production-market-data`:

```
$ git push origin HEAD:arena/01a0d1d3-iips-production-market-data
   bac1467..fc5ab69  HEAD -> arena/01a0d1d3-iips-production-market-data
```

`git ls-remote` immediately after the push returned
**`fc5ab69186a7e0dd82d676a54aeb35f90f580bdc`** for
`refs/heads/arena/01a0d1d3-iips-production-market-data` — identical to local `HEAD` at the moment of
verification. The branch tip is one further **report-only** commit beyond it (this section's
completion), which changes no source file.

## 11. LOCAL == REMOTE

**TRUE — verified.**

* `git rev-parse HEAD` == `git ls-remote origin refs/heads/arena/01a0d1d3-iips-production-market-data`
  at `fc5ab69186a7e0dd82d676a54aeb35f90f580bdc`, checked immediately after the push.
* Re-verified at the report-completion tip: the two SHAs are again identical, and the completion
  commit is confined to `IIPS_RESEARCH_SECTOR_READ_AUTHORITIES_REPORT.md`.
* No completed work remains only in the Arena workspace.

## 12. Workspace status

**CLEAN.**

* `git status --porcelain` prints nothing (no modified, no staged, no untracked files).
* Generated output — `dist/`, `dist-frontend/`, `node_modules/` — is covered by the repository's
  existing `.gitignore` and is therefore deliberately **not** committed; no large artifact was added.
* No credentials, tokens, or Git TLS configuration were read, written, or changed.

---

## Durability checkpoint

Ran as one logical unit: implement → test → commit → push → verify LOCAL == REMOTE → verify clean
workspace. No completed work remains only in the Arena workspace. If the commit or push had failed,
the run would have STOPPED here and Prompt 3 would not be started.

## Scope discipline / what this does NOT authorize

* Company Intelligence and Sector Intelligence **UI surfaces remain unrecovered**. No route, nav,
  layout, or component was added; no visual parity is claimed.
* Decision Matrix UI, Evidence UI, Replay UI, AI Advisory, auth tier, Keycloak/OIDC, PIT vintage
  branch, D114/D115, provider activation, production configuration, Windows artifacts, macro/MoSPI:
  all untouched.
* `main` remains `4d3e1cdcaa33…`. No merge, no rebase, no force-push, no credentials or Git TLS
  change.
* This transport is **NON_PRODUCTION, unauthenticated, and not certified** — it must not be exposed
  beyond a local development boundary.
* **Prompt 3 has not been started.** This unit stops here.
* Open item for review: the single documented `keyMetrics` deviation (§4) — flagged, not hidden.
