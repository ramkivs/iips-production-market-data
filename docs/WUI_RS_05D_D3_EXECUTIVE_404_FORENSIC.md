# WUI-RS-05D-D3: Executive `/api/executive` 404 (read-only forensic report)

```
FORENSIC_ONLY=YES
APPLICATION_SOURCE_CHANGED=NO
D2_IMPLEMENTATION_MODIFIED=NO
EXECUTIVE_ROUTE_ADDED_OR_REPAIRED=NO
WINDOWS_RUNTIME_VERIFIED_BY_ARENA=NO   (Windows evidence below is operator-reported)
ROOT_CAUSE=DETERMINED — dev proxy sends ALL /api/* to the 8788 Research/Sector authority,
           which has no /api/executive route; the only /api/executive handler (8787) is
           never started and is not a proxy target.
INTRODUCED_BY_D2=NO (pre-existing since WUI-RS-05A topology)
```

## 1. Baseline

| Item | Value |
|---|---|
| Governing branch | `arena/01a0d1d3-iips-production-market-data` at `2a80b5686dff7f1b3e6a3b523ac18ec2d988860c` (D2), confirmed with `ls-remote` |
| main | `4d3e1cdca3a33da0ec3be8b336b17128108a502c` |
| State inspected | the tree at `2a80b56`. The sandbox had been restored from a shallow checkout. The worktree was verified byte-identical to `2a80b56` through a temporary index before inspection, and the local ref was then re-pointed to that already-pushed commit. No file was changed. `node_modules` was reinstalled with `npm ci` for the reproduction. |

## 2. Operator-reported Windows evidence

This was observed by the operator in Chrome DevTools on Windows. Arena did not observe it.

- `GET http://localhost:5173/api/executive` returned **404 Not Found**. The initiator is `authFetch.ts:22`. It was requested **twice**.
- `/api/company/Banking` returned 200 JSON.
- `/api/decision-matrix` returned 200 JSON.

## 3. Evidence chain (Browser → Vite → proxy → process → route → handler)

| Hop | File : line | Evidence |
|---|---|---|
| 1. Route mount | `frontend/src/app/App.tsx:363` | `<Route path={ROUTES.executive} element={<ExecutiveDashboard />} />`, with no `initialData` prop. |
| 2. Fetch trigger | `frontend/src/features/executive/ExecutiveDashboard.tsx:48-56` | `useEffect(() => { if (initialData) return; … fetchExecutiveData() … }, [initialData])` |
| 3. Client URL | `frontend/src/api/executive.ts` (`fetchExecutiveData`) | ``authFetch(`${baseUrl}/api/executive`)``, where `baseUrl = ''`, so the URL is a **relative** `/api/executive`, method GET. `if (!res.ok) throw new Error(\`executive transport returned ${res.status}\`)`. |
| 4. Fetch | `frontend/src/api/authFetch.ts:22` | `return fetch(input, { ...init, headers });`. This matches the reported initiator line. |
| 5. Vite proxy | `vite.config.ts` → `server.proxy` | `'/api': { target: 'http://127.0.0.1:8788' }`. This is the **only** proxy rule. It is a prefix match, so every `/api/*` path, `/api/executive` included, is forwarded to 8788. There is no path rewrite and no `/api/executive`-specific rule. It was introduced by `42f1d9a` (WUI-RS-05A). |
| 6. Target process | `package.json` `dev:research-sector` → `frontend/server/research-sector-dev-server.ts:24,40,52` | `import { createResearchSectorServer } from './research-sector-transport.js'` … `server.listen(port, host)`, on `127.0.0.1:8788`. It imports and starts **only** the Research/Sector server. |
| 7. Route registration at 8788 | `frontend/server/research-sector-transport.ts:541` (`/api/health`), `:496` (`/api/decision-matrix`), `:432-434` (`/api/company/`, `/api/evidence/`, `/api/replay/`) | These are the only registered paths. |
| 8. Final handler at 8788 | `research-sector-transport.ts` `handleResearchSectorRequest` → `return notFound();` | `notFound()` returns `{ status: 404, body: { error: 'not found' } }`. The server adds the header `X-IIPS-Surface: research-sector-snapshot-authorities`. |
| (Handler that is never reached) | `frontend/server/executive-transport.ts:15,33` | `createExecutiveServer(port = 8787)` handles `req.url === '/api/executive'` with `computeCertifiedExecutive()`. **Nothing calls `.listen()` on it.** It has no launcher, no npm script and no proxy rule. A repository-wide search for `createExecutiveServer` or `8787` in non-generated TS/JS/JSON finds only its definition. |

**Arena-side reproduction** (Linux sandbox, same scripts, not Windows):

- `node dist/frontend/server/research-sector-dev-server.js` and `npx vite --port 5173` were started, then queried with `curl`.
- Results:

```
/api/executive        via 5173 → 404  X-IIPS-Surface: research-sector-snapshot-authorities  {"error":"not found"}
/api/company/Banking  via 5173 → 200  X-IIPS-Surface: research-sector-snapshot-authorities  {"companyId":"Banking-H1",…}
/api/decision-matrix  via 5173 → 200  X-IIPS-Surface: research-sector-snapshot-authorities  {"matrixType":"scatter",…}
/api/health           via 5173 → 200  X-IIPS-Surface: research-sector-snapshot-authorities
direct 127.0.0.1:8788/api/executive → 404 {"error":"not found"}
127.0.0.1:8787 → connection refused (no listener)
```

The `X-IIPS-Surface` header proves that the 404 is issued by the 8788 authority's `notFound()`. It does not come from Vite. Both processes were stopped afterwards.

**Operator confirmation (optional, read-only).** In the Windows DevTools response headers for the 404, look for `X-IIPS-Surface: research-sector-snapshot-authorities`, with the body `{"error":"not found"}`. If they are present, the Windows 404 has the identical origin.

## 4. Answers

1. **Is `/api/executive` registered anywhere?**
   Yes, but only in `frontend/server/executive-transport.ts:33`, inside `createExecutiveServer` (default port 8787). It is **not** registered in the Research/Sector authority, which is the only server the dev topology starts.
2. **Which process is expected to serve it?**
   By code design, the Executive transport server on 8787. No script, launcher or document in the current tree starts that process.
3. **Does the Vite proxy forward `/api/executive`?**
   Yes. The `'/api'` prefix rule forwards it.
4. **Proxy target?**
   `http://127.0.0.1:8788`, the Research/Sector SNAPSHOT authority.
5. **Does the target register an Executive route?**
   **No.** `handleResearchSectorRequest` knows `/api/decision-matrix`, `/api/company/:id`, `/api/evidence/:id` and `/api/replay/:id` (plus `/api/health`). Every other path, including `/api/executive`, falls through to `notFound()`, which returns 404.
6. **Different path, method or runtime condition?**
   - **Path:** the same, `/api/executive`, in both client and server.
   - **Method:** GET, which the 8787 handler accepts (it does not check the method).
   - **Runtime conditions:**
     - (a) The 8787 process must be listening. It is not.
     - (b) The request must be routed to 8787. It is not.
     - (c) `computeCertifiedExecutive` resolves its inputs through `process.cwd()` (`src/transports/executive_transport.ts:23-35`), so that process must run from the repository root. This is a known constraint.
     - `executive-transport.ts` also sets `Access-Control-Allow-Origin: *`. This does not matter behind a same-origin proxy and is not used as a workaround.
7. **Why company and decision-matrix return 200 but executive returns 404?**
   All three go to the same process, 8788. That process implements the first two and not the third. The proxy does not distinguish between them.
8. **Pre-existing or introduced by D2?**
   **Pre-existing.**
   - `git diff --stat 9c215b4 2a80b56` shows that D2 changed only `frontend/src/index.css` (+20 colour variables), two test files and one doc. It touched no server, proxy, script or client.
   - The single `/api` → 8788 proxy dates from WUI-RS-05A (`42f1d9a`). The 05A commit message states that the Executive transport was deliberately left unchanged.
   - `executive-transport.ts` was last changed in `ea70a8c` (Stage-4 recovery), and no launcher for it was ever added.

**Why the request happens twice (INFERENCE from code):** `frontend/src/main.tsx` wraps the app in `<React.StrictMode>`. In development, React 18 StrictMode mounts, unmounts and re-mounts every component once, so the `useEffect` fetch in `ExecutiveDashboard.tsx:48` runs twice. There is no retry logic in the client. Production builds do not double-invoke effects.

## 5. Root cause

The WUI-RS-05A dev topology provides exactly one API backend: the Research/Sector authority on 127.0.0.1:8788. Its single Vite proxy rule sends **all** `/api/*` traffic there. The Executive Dashboard's `/api/executive` is served only by `createExecutiveServer`, which is never started and is not a proxy target. The 8788 authority therefore answers with its fail-closed 404 `{"error":"not found"}`. `ExecutiveDashboard` then shows its honest error state ("executive transport returned 404"), exactly as designed (WUI-RS-03C: no fabricated data).

## 6. Affected files

These are involved in the fault; none was modified:

- `vite.config.ts`: the single `/api` → 8788 rule.
- `frontend/server/executive-transport.ts`: the handler exists but has no launcher.
- `frontend/server/research-sector-dev-server.ts` and `package.json` (`dev:research-sector`): these start 8788 only.
- `frontend/server/research-sector-transport.ts`: its correct fail-closed 404.
- `frontend/src/api/executive.ts`, `frontend/src/api/authFetch.ts`, `frontend/src/features/executive/ExecutiveDashboard.tsx`: the client path, which is behaving correctly.

## 7. Is a code change required?

**Only if the Executive data-rendered state must be observable in the dev/acceptance topology.** Nothing is malfunctioning: every component behaves as designed. The gap is a **missing dev topology leg** for Executive. It is not a bug in the route or the client.

- Without a change, D3 must record the Executive surface as "data-rendered state not available in current dev topology". D1 §13 anticipated this ("when available").
- Making it available requires a change that the 05A constraints did not authorize: 05A authorized only the Research/Sector proxy and the 8788 startup, and "no … Executive transport … changes". A new authority act is therefore needed.

## 8. Smallest safe remediation scope (NOT implemented; requires authorization)

**Option R-1 (smallest, mirrors 05A exactly):**

1. Add `frontend/server/executive-dev-server.ts`. It would call the existing `createExecutiveServer(8787).listen(8787, '127.0.0.1')`, following the same pattern as the Research/Sector launcher: loopback only, fail closed on EADDRINUSE, a Windows-safe entry guard, and SIGINT/SIGTERM handling.
2. Add the npm script `dev:executive`. It must be Windows-safe with no Unix syntax, and must run from the repository root because of the `process.cwd()` constraint.
3. Add a **more specific** proxy rule `'/api/executive': { target: 'http://127.0.0.1:8787' }` to `vite.config.ts`, declared **before** `'/api'`. Vite matches proxy keys in declaration order, so the specific rule must come first. The existing `/api` → 8788 rule is left untouched.
4. Add tests on the model of `wui_rs_05a_dev_acceptance_topology.test.ts`: the proxy order, the Executive request reaching 8787 end to end, company/decision-matrix/evidence/replay still reaching 8788, and loopback-only binding.

The following would **not** change: `executive-transport.ts` (its handler and contract), the Research/Sector authority, the client code, D2 colours and production. `server.proxy` is dev-only and absent from `vite build`.

**Rejected alternatives:**

- Registering `/api/executive` inside the 8788 authority would modify the authority handler, which the 05A constraints forbid, and would merge two authorities.
- Calling 8787 directly from the browser would need an absolute URL or a CORS path, which the 05A constraints forbid.

## 9. D2 status

**D2 is unaffected.**

- The 404 originates in the dev API topology. D2 changed only CSS custom properties inside `.app-shell` and their tests.
- The operator evidence shows the Research/Sector APIs working (200), so the D3 colour verification can proceed on Sector, Company and Security Master.
- The Executive data-rendered colour check stays **blocked by topology**. It is not a D2 defect.
- The Portfolio (BI-07) regression check is unaffected.

## 10. Correction by addition

05D-B §7 said "Under the dev topology `/api/executive` is not proxied". More precisely, it **is** proxied, but to 8788, which does not serve it. The 05D-B report is not modified.

## 11. Next step

Operator decision required:

- **(a)** Proceed with the D3 Windows colour verification on Sector, Company, Security Master and Portfolio, and record Executive as topology-blocked; **or**
- **(b)** Authorize a scoped "WUI-RS-05E Executive dev topology" gate implementing R-1, then run the Executive part of D3.
