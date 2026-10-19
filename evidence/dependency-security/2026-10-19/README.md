# IPD dependency security audit — 2026-10-19 UTC

## Disposition

**Partial remediation, not a clean audit:** the high-severity source-map advisory is fixed. The two moderate npm package findings remain, representing two distinct React Router advisories plus the affected `react-router-dom` parent. No patched v6 release exists at inspection time. Neither Router advisory has a demonstrated exploitable application path in this personal-use application; that does **not** remove the vulnerable installed versions or resolve their audit findings.

## Verified baseline

- Repository: `ramkivs/iips-production-market-data` only. `git fetch origin main`, local HEAD and `origin/main` all returned `a5c3069abac17cf572dce012729d823fcb04fd50`; initial worktree clean.
- Work branch: `arena/7b2e212f-iips-production-market-data`. No other branch was checked out or created.
- Recent history: PR #31 tracker reconciliation; PR #30 AIIL/provenance correction (`63b8bee` merge); PR #29 Security Master closure tracker; PR #28 Security Master integrity correction (`bdc3caa` merge). Full eight-commit list in `verification.json` (history deepened read-only to inspect parents).
- Node `v22.22.3`, npm `10.9.8`. Root has no `engines`, `packageManager`, or separate Node pin. CI `.github/workflows/ci.yml` uses Node 22, locked `npm ci --no-audit --no-fund`, `npx tsc --noEmit`, `npm run build`, and guarded `npm test` with an executed-test-count check. The installed Vite/Rolldown require Node `^20.19.0 || >=22.12.0`; this environment satisfies them. Lockfile v3.
- The normal audit is plain `npm audit`, including development dependencies, with no severity filtering. Complete results: `baseline-audit.json` and `baseline-audit.txt`; both exited 1 for findings, not an audit-service failure. Baseline `npm ci --no-audit --no-fund` exited 0. Resolved installation tree: `baseline-tree.json`.
- Baseline repeats the historical **2 moderate, 1 high package findings**. npm counts vulnerable package nodes, not distinct advisory identifiers: `react-router` contains two advisories; `react-router-dom` is a moderate parent/metavulnerability; `source-map-js` has one advisory. There are three distinct GHSA IDs, not an extra independent advisory in `react-router-dom`.

## Advisory-by-advisory investigation

| Advisory / severity | Installed path and purpose | Affected / patched ranges | Reachability and disposition |
|---|---|---|---|
| [GHSA-68fv-2mgg-jv7q](https://github.com/advisories/GHSA-68fv-2mgg-jv7q), CVE-2026-93749; **high**, CVSS 7.5 | `IPD → vite@8.3.0 → postcss@8.5.28 → source-map-js@1.2.1`; transitive **development/build tooling** | `>=1.0.0 <1.2.2`; first patched `1.2.2` | Indexed source maps with enormous section offsets can block the event loop / exhaust resources. PostCSS `previous-map.js`, `map-generator.js`, and `input.js` invoke `SourceMapConsumer`; dev/build processing of a hostile CSS source map can reach it. Normal inputs are repository-controlled CSS; broker CSV and D05 data do not feed CSS maps. Not shipped in the browser bundle; no production Node source-map processing entry point found. **Fixed by compatible patch to 1.2.2.** |
| [GHSA-wrjc-x8rr-h8h6](https://github.com/advisories/GHSA-wrjc-x8rr-h8h6), CVE-2026-53669; **moderate** (GitHub medium) | `IPD → react-router-dom@6.30.6 → react-router@6.30.6`; direct parent, transitive vulnerable package; **browser runtime**, also route-rendering tests | `>=6.0.0 <7.18.0`; first patched `7.18.0` | Follow-up to CVE-2025-68470: backslash-containing attacker-supplied navigation targets can unexpectedly navigate externally. `main.tsx` mounts `BrowserRouter`; `Sidebar.tsx` passes checked-in `navigation.ts` paths to `NavLink`; `App.tsx` redirects root/unknown paths to fixed `ROUTES.portfolio`. No app `useNavigate` or `<Link>` call site or attacker-derived `to` found. Security Master query values enter `URLSearchParams` for the current route, not a destination pathname. Vulnerable navigation library is shipped, but no attacker-controlled path into the dangerous functionality was identified. **Unresolved installed vulnerability; low exposure under inspected fixed-navigation behavior, not fixed.** |
| [GHSA-337j-9hxr-rhxg](https://github.com/advisories/GHSA-337j-9hxr-rhxg), CVE-2026-53666; **moderate**, CVSS 6.1 | Same runtime path and versions as above; not a second installation | `>=6.4.0 <7.18.0`; first patched `7.18.0` | Arbitrary constructor selection during `deserializeErrors()` SSR hydration requires specific application-layer attacker error overwrites. Upstream explicitly excludes Declarative Mode. This app uses `ReactDOM.createRoot`, `BrowserRouter`, `Routes`/`Route`; no `hydrateRoot`, Framework/Data Mode router or server hydration error channel exists in production source. Tests using `MemoryRouter` and server-rendered markup do not create a production SSR hydration channel. **Not applicable to current execution mode, but remains unresolved in the installed dependency and in npm audit.** |

Source evidence is preserved in the three `GHSA-*.json` GitHub advisory snapshots. `source-map-upstream-patch.json` records upstream commit `cf7658058ceeaa8619d5ae0ec90be6905209d016`: offset validation including nested cumulative bounds, linear nested source lookup, efficient gap serialization, and short-circuiting past the generated code. The patch is consumed from the published npm tarball, not copied into application code.

### Smallest safe correction and alternatives

- PostCSS permits `source-map-js@^1.2.1`; `1.2.2` satisfies the existing range and Node requirement. Ran **`npm update source-map-js --package-lock-only --ignore-scripts --no-audit --no-fund`** then a clean `npm ci`. Only its version, tarball URL and integrity changed. `lockfile-change.json` verifies this is the **only changed package entry**. Vite, PostCSS, React, TypeScript and every other package remain locked as before. `package.json` is byte-unchanged.
- React Router v6 registry releases were enumerated (`router-v6-versions.json`); latest is `6.30.6`, already installed and still affected. `react-router-dom@6.30.6` requires exact `react-router@6.30.6` and `@remix-run/router@1.23.4`; there is no compatible patched version inside `^6.30.6`. Merely updating the Remix router cannot fix the affected React Router code. Overriding its exact child to v7 would combine unsupported major-version components. A custom vendored/forked patch would add unsupported maintenance rather than a published compatible remediation. Removing/replacing the router is not a smaller dependency-only correction.
- npm proposes `react-router-dom@7.18.4` as a **breaking change**. v7 migration can affect routing, path/splat resolution and data/error behavior; it needs a separately scoped compatibility migration, not a forced audit cleanup. No major upgrade, override, suppression, advisory severity change, or CI edit was made. `npm audit fix --force` was **not run**.
- Smallest remaining action: consume a vendor v6 backport if one is published, or separately scope and validate a supported paired Router v7 upgrade (patched floor 7.18.0). Reassess exposure before accepting dynamic/untrusted navigation targets or adding SSR/hydration. Do not mark the Router findings resolved in the meantime.

## Verification after the coherent lockfile remediation

| Command / check | Result / evidence |
|---|---|
| `npm ci --no-audit --no-fund` | Exit 0; `remediated-install.txt`. Reproducible install using unchanged manifest and updated lock. |
| `npm audit --json`; `npm audit` | Both exit **1**; **2 moderate, 0 high, 0 critical**. Complete `remediated-audit.json` / `.txt`; high GHSA gone, Router GHSA IDs retained. |
| `npm audit --omit=dev --json` | Exit **1**, same two moderate package findings; `runtime-audit.json`. Production-only audit was supplementary, not used to hide the baseline high. |
| `npm ls --all --json` | Exit 0, no invalid dependency tree; `remediated-tree.json`. |
| `node --test evidence/dependency-security/2026-10-19/source-map-regression.test.mjs` | **7/7 pass**: huge/malformed offsets, nested cumulative bound, valid indexed mapping, SourceNode past-end shortcut, generator gaps, PostCSS previous-map integration. `focused-source-map-tests.txt`. |
| Focused compiled application tests | **319/319 pass**, 43 suites: all D05, shell, BI07, BI08, broad-universe multi-broker integration and P13 UI integration. Includes Security Master integrity/AIIL and frontend route tests. `focused-application-tests-summary.txt` and compressed complete output. |
| `npm test` (repository guarded runner) | **584/584 pass**, 90 suites, 0 fail/cancelled/skipped; 52 source/compiled files. `full-guarded-tests-summary.txt` and compressed complete output. |
| `npx tsc --noEmit` | Exit 0, zero errors; `typecheck.txt` (empty output is expected). |
| `npm run build` | Exit 0, TypeScript emit and Vite production bundle; `build.txt`. Existing >500 kB chunk warning only; not suppressed. |
| Production frontend HTTP/bundle smoke | `/`, `/portfolio`, Security Master links for `539177` and `543989`, JS/CSS assets: HTTP 200 with remote-preview-style Host accepted. All 64 bundle sources inspected: no PostCSS/source-map-js shipped. `frontend-smoke.json`. Temporary preview stopped. This is not a real-browser/DOM automation claim. |
| Scope/integrity diff | Only lockfile and audit evidence/tracker are intended changes. All source, tests, frontend, CI, D05 JSON, TS mirror and manifest remain byte-identical to baseline. CV-22 Option C / 13-row IRR behavior unchanged; no consumer integration touched. |

Focused test replay:

```sh
npm ci --no-audit --no-fund
node --test evidence/dependency-security/2026-10-19/source-map-regression.test.mjs
npx tsc --noEmit
npm run build
node --test dist/tests/d05_*.test.js dist/tests/shell_*.test.js dist/tests/bi07_*.test.js dist/tests/bi08_*.test.js dist/tests/e2e_broad_universe_multi_broker_integration.test.js dist/tests/wse_p13_ui_integration.test.js
npm test
npm audit --json  # expected exit 1 while the two moderate Router package findings remain
```

One initial focused evidence-test run was 6/7: its fixture helper replaced an explicitly passed `undefined` column with its default zero, producing a missing-exception assertion. Fixed the **test fixture**, not the dependency or its expected validation; explicitly assign every invalid field after construction. Retained `focused-source-map-tests-initial-harness-error.txt` and the final 7/7 output. No product/test-suite failure was concealed. Application test output includes existing React server-render warnings; raw output is losslessly gzip-compressed to avoid large repetitive logs in Git, with uncompressed SHA256 recorded in each summary.

## Publication and tracker

Authoritative IPD reconciliation record: `evidence/np04/IIPS_v3.0_IPD_IRR_CAPABILITY_INVENTORY_AND_TRACKER_RECONCILIATION_2026-10-17.md`, addendum A3. The historical workbook and previous addenda/statuses are preserved. Publication, merge, exact-head CI and remote verification evidence will be appended after those operations actually complete; no future result is asserted here.

Branch-protection details endpoint returned `403 Resource not accessible by integration`; this is a permission limitation, not evidence of absent rules. Use normal PR mergeability and check results, with no administrative bypass.

## Boundaries

All writes remain within IPD; **no IRR access or writes occurred**. No authentication, RBAC implementation, multi-user capability, PostgreSQL, persistence, enterprise deployment, provider or service was added. Application remains single-user, strictly personal-use, with its existing non-production boundaries. Security Master corrections and D05 source/manifest are preserved. CV-22 Option C, existing 13-row IRR behavior and consumer integration scope are untouched. Passing tests and CI do **not** imply the remaining moderate vulnerabilities are fixed.

## Verified implementation publication — completed 2026-10-19

- Implementation commit: `8499ab3c963944aec7f74b2d3872c1ade9a0839d`.
- [PR #32](https://github.com/ramkivs/iips-production-market-data/pull/32), normal merge at **2026-10-19T19:43:58Z** → authoritative `main@fc67340fce44a0cb21bf75cfaf1c5bf5b57ca9d2`. Mergeability was `MERGEABLE` / `CLEAN`, both checks successful, no outstanding review decision; no bypass or history rewrite.
- PR [CI run 39313285152](https://github.com/ramkivs/iips-production-market-data/actions/runs/39313285152): **success**; exact-head executed-test-count check **118268435200**, **584 passed / 0 failed**.
- Post-merge [CI run 39313422498](https://github.com/ramkivs/iips-production-market-data/actions/runs/39313422498): **success**; exact-merge executed-test-count check **118268887625**, **584 passed / 0 failed**. Includes locked install, typecheck, full build and guarded tests.
- `git fetch origin main` and `git ls-remote origin refs/heads/main` both verified the implementation merge SHA. All **29 changed paths** are Git-blob-identical to verified PR head, including both dependency files and the tracker. The GitHub contents API independently returned tracker blob `0febab93564c47ed1b34502726aa5cf200521732` on remote main.
- Source, tests, frontend, CI, D05 corpus, generated mirror and manifest remain byte-identical to initial `main@a5c3069`. Full changed-path and check-run evidence: `post-merge-verification.json`.
- Fast-forwarded **the same session branch** to the verified merge (no branch switch) and repeated clean `npm ci`, audit in both formats, and focused package checks. Install exit 0; **7/7** package checks pass; audit still exits **1**, **2 moderate / 0 high / 0 critical**. Complete files: `post-merge-install.txt`, `post-merge-audit.json`, `post-merge-audit.txt`, `post-merge-source-map-tests.txt`.
- This post-merge record and tracker A3.4 are documentation/evidence-only follow-up publication. The final follow-up merge/ref/CI and remote tracker presence will be verified and reported at completion; this record does not claim to contain its own future merge SHA.

**Final security disposition: high advisory remediated; both moderate Router advisories remain recorded, with no compatible published v6 fix.**
