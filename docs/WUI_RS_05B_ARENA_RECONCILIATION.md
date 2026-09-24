# WUI-RS-05B — Arena Reconciliation (Windows Research/Sector End-to-End Acceptance)

Read-only forensic reconciliation. No application source, configuration, test, server code, WUI-RS-05A implementation file or Windows evidence file was modified. This document is the only change.

## 1. Identity and durability

| Item | Value |
|---|---|
| Implementation baseline (WUI-RS-05A) | `42f1d9aa997bc8cd816f85b2965f8321d13398df` |
| Windows evidence commit | `d22277f0a3033016786aafafeb3bda45c8570045` ("docs: record WUI-RS-05B Windows acceptance") |
| Parent of `d22277f` | `42f1d9aa997bc8cd816f85b2965f8321d13398df` (its only parent) ✔ |
| Evidence file | `.iips-evidence/wui-rs-05b/windows-research-sector-acceptance.txt` (44 lines, UTF-8 with BOM) |
| `d22277f` diff vs `42f1d9a` | exactly 1 file added (the evidence file); 0 application changes ✔ |
| `origin/arena/01a0d1d3-iips-production-market-data` at reconciliation | `d22277f0a3033016786aafafeb3bda45c8570045` ✔ |
| Local reconciliation checkout | fast-forwarded (`--ff-only`) to `d22277f`; worktree clean ✔ |
| `origin/main` | `4d3e1cdca3a33da0ec3be8b336b17128108a502c` (unchanged) ✔ |

## 2. Implementation reconciliation (`42f1d9a`)

`42f1d9a` changes exactly four files, relative to its parent `6328149`:

| File | Content verified |
|---|---|
| `vite.config.ts` | `server.proxy` `'/api' → { target: 'http://127.0.0.1:8788' }` only. No `preview` block, no rewrite, no `changeOrigin`, no CORS. Labelled DEV/ACCEPTANCE-ONLY. |
| `package.json` | Adds only `dev:research-sector` = `tsc && node -e "…copyFileSync(iips-platform/package.json → dist)…" && node dist/frontend/server/research-sector-dev-server.js`. No `cp`, so it works under `npm.cmd`. Other scripts unchanged. |
| `frontend/server/research-sector-dev-server.ts` | Calls the existing `createResearchSectorServer(port)` and then `.listen(8788, '127.0.0.1')`. Adds no handler, header, CORS, auth or PIT behaviour. Fails closed on EADDRINUSE. |
| `tests/wui_rs_05a_dev_acceptance_topology.test.ts` | 12 topology tests. |

Between `6328149` and `d22277f`, these paths have **zero diff**: `src/`, `frontend/src/` (including all API clients), `frontend/server/research-sector-transport.ts` and `frontend/server/executive-transport.ts`. So the authority semantics are unchanged, and no authentication was fabricated. The transport still declares "NO authentication and NO authorization".

The evidence claims nothing that this implementation doesn't provide. Its topology (authority on 8788, frontend on 5173, `/api` proxied to 127.0.0.1:8788) matches the implementation exactly.

## 3. Research/Sector contract reconciliation (at `d22277f`)

- **Relative clients.** `company.ts`, `decisionMatrix.ts`, `evidence.ts` and `replay.ts` call `` authFetch(`${baseUrl}/api/…`) `` with `baseUrl = ''`. Every caller (`SectorIntelligence.tsx`, `CompanyIntelligence.tsx`) uses the default. So a Windows local runtime needs the WUI-RS-05A dev proxy to reach 8788.
- **Company and Sector routes.** `/research/company/:id` and `/research/sector/:id` are mounted in `frontend/src/app/App.tsx`. Both surfaces read only the four Research/Sector SNAPSHOT endpoints.
- **asOf / PIT.** The authority refuses `asOf` with 400 (`ASOF_REFUSED_UNDER_SNAPSHOT`) and has no PIT code path. Tests RA-* and T-03a confirm this.
- **AI advisory.** `AdvisoryDeferred` renders the documented DEFERRED state and makes no network request.
- **Replay/evidence.** `reproduced` and `byteIdentical` are hardcoded D79 fixture constants, and the verbatim attribution states they are NOT produced by runtime verification. They are **NOT VERIFIED**.
- **AD-17 / M-2.** Still UNRESOLVED, as stated in the transport source.
- **Nothing activated.** No provider, network credential or production entitlement is activated or implied.

## 4. Node-edge reconciliation

- **WUI-RS-03C remediation is present.** `frontend/src/api/executive.ts` imports only a type and `authFetch`. No `executive_transport` import exists anywhere in `frontend/src`.
- **No `node:*` imports.** There are none in `frontend/src`, either added by WUI-RS-05A or pre-existing.
- **Arena build of `d22277f`.** The Vite bundle has 0 references to `node:(fs|path|url|module|http|net|crypto)`, `createRequire` or `browser-external`. It has 0 references to `computeCertifiedExecutive` / `computeCertifiedPlatform`, and 0 to `8788`.
- **Windows browser.** The evidence records `NODE_MODULE_CREATE_REQUIRE_ERROR=ABSENT`.

## 5. Test/build reconciliation

Re-run **independently in Arena (Linux, Node v22.22.3) at `d22277f`**, after a clean `dist`/`dist-frontend`. This is fresh execution evidence, not copied from earlier reports:

| Check | Result |
|---|---|
| WUI-RS-05A topology tests | 12/12 pass, 0 skipped |
| Research/Sector + Executive + browser-runtime tests (6 files) | 116/116 pass, 0 skipped |
| Full regression (`npm test`) | 661/661 pass, 110 suites, 0 fail, 0 skipped |
| `npm run build:tsc` and `tsc --noEmit` | PASS |
| `vite build` | PASS (only the chunk-size warning that was already there) |

These are Linux results. On Windows, the TSC and Vite build results come only from the evidence file (`TSC=PASS`, `VITE_BUILD=PASS`), which doesn't say which command produced them.

## 6. Observations supported by the Windows evidence

**Runtime:**
- Authority at `127.0.0.1:8788`, frontend at `127.0.0.1:5173`, proxy `5173 /api → 127.0.0.1:8788`.
- Both ports LISTENING.

**API:**
- company/Banking, decision-matrix, evidence/Banking and replay/Banking each returned `200 application/json`.
- `asOf` returned `400`.

**Browser** (route `/research/sector/Banking`):
- `SHELL_RENDER=PASS`, `SECTOR_ROUTE_RENDER=PASS`.
- `COMPOSITE=47.1`, `RECOMMENDATION=Watch`, `SECTOR_COUNT=13`. These match the certified Banking values from the authority (composite 47.1, recommendation Watch, 13-sector decision matrix).
- Also recorded: `AI_ADVISORY=DEFERRED_BY_AUTHORITY`, `REPLAY_REPRODUCED` / `REPLAY_BYTE_IDENTICAL = REPORTED_NOT_VERIFIED`, `AD_17_M_2=UNRESOLVED`, `APPLICATION_SOURCE_CHANGED=NO`.

## 7. Evidence limitations (stated, not blocking)

1. **The API results don't name the port they were probed on** (5173 or 8788). That the data went through the proxy follows from the implementation, not from the API lines. The browser clients are relative, and the 8788 authority sends no CORS headers. So Banking data rendering at the `127.0.0.1:5173` origin can only have arrived via the `/api → 8788` proxy.
2. **The evidence file is a summary written by the operator.** It doesn't record the exact startup command strings (`npm.cmd run dev:research-sector` / `npm.cmd run dev`), raw server logs, other console errors, or the `asOf` refusal body text.
3. **Company Intelligence (`/research/company/:id`) was not recorded as observed.** No Company browser acceptance is claimed.
4. **`FRONTEND=127.0.0.1:5173` is the browser address.** The existing Vite config binds `0.0.0.0` (pre-existing, not changed by WUI-RS-05A).
5. **No visual/pixel parity and no production acceptance are claimed.**

## 8. Final disposition

Every required check passed: remote tip, parent linkage, evidence content, implementation scope, contracts and limitations, node-edge, independent test/build re-run, and main unchanged.

**WUI-RS-05B = ACCEPTED**

This covers functional Windows local-runtime acceptance of the Research/Sector **Sector** route through the authorised dev/acceptance topology. It is non-production. It gives no Company-route acceptance and no production, PIT, AI advisory or replay-verification acceptance.
